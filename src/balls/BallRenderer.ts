/**
 * BallRenderer - PixiJS renderer for bouncing balls simulation
 * Based on Calitree's TreeRenderer pattern
 */

import { Application, Graphics, Container } from "pixi.js";
import type { Ball, BallState, Theme } from "./types";

const THEME_COLORS = {
  dark: {
    background: 0x0a0a0f
  },
  light: {
    background: 0xf5f5f7
  }
};

interface BallRendererOptions {
  onBallClick?: (ballId: string) => void;
}

export class BallRenderer {
  private app: Application | null = null;
  private container: Container | null = null;
  private ballGraphics: Map<string, Graphics> = new Map();
  private options: BallRendererOptions;
  private state: BallState = {
    balls: [],
    gravity: 0.5,
    friction: 0.99,
    paused: false
  };
  private theme: Theme = "dark";
  private width = 800;
  private height = 600;
  private isInitialized = false;
  private isDestroyed = false;

  constructor(options: BallRendererOptions = {}) {
    this.options = options;
  }

  async init(
    containerElement: HTMLElement,
    width: number,
    height: number
  ): Promise<void> {
    if (this.isInitialized || this.isDestroyed) {
      return;
    }

    this.width = width;
    this.height = height;

    // Create PixiJS application
    const app = new Application();
    await app.init({
      width,
      height,
      backgroundColor: THEME_COLORS[this.theme].background,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    // Check if destroyed during async init
    if (this.isDestroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;

    // Append canvas to container
    containerElement.appendChild(this.app.canvas);

    // Create container for balls
    this.container = new Container();
    this.app.stage.addChild(this.container);

    // Start animation loop using PixiJS ticker
    this.app.ticker.add(this.tick.bind(this));

    this.isInitialized = true;
  }

  private tick(): void {
    if (!this.state.paused) {
      this.updatePhysics();
    }
    this.render();
  }

  private updatePhysics(): void {
    for (const ball of this.state.balls) {
      // Apply gravity
      ball.vy += this.state.gravity;

      // Apply friction
      ball.vx *= this.state.friction;
      ball.vy *= this.state.friction;

      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Bounce off walls
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * 0.8;
      }
      if (ball.x + ball.radius > this.width) {
        ball.x = this.width - ball.radius;
        ball.vx = -ball.vx * 0.8;
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy * 0.8;
      }
      if (ball.y + ball.radius > this.height) {
        ball.y = this.height - ball.radius;
        ball.vy = -ball.vy * 0.8;
      }
    }
  }

  private render(): void {
    if (!this.container) return;

    // Update or create graphics for each ball
    const currentBallIds = new Set(this.state.balls.map((b) => b.id));

    // Remove graphics for balls that no longer exist
    for (const [id, graphics] of this.ballGraphics) {
      if (!currentBallIds.has(id)) {
        this.container.removeChild(graphics);
        graphics.destroy();
        this.ballGraphics.delete(id);
      }
    }

    // Update or create graphics for each ball
    for (const ball of this.state.balls) {
      let graphics = this.ballGraphics.get(ball.id);

      if (!graphics) {
        graphics = new Graphics();
        graphics.eventMode = "static";
        graphics.cursor = "pointer";
        graphics.on("pointerdown", () => {
          this.options.onBallClick?.(ball.id);
        });
        this.container.addChild(graphics);
        this.ballGraphics.set(ball.id, graphics);
      }

      // Clear and redraw
      graphics.clear();

      // Draw ball
      graphics.circle(0, 0, ball.radius);
      graphics.fill({ color: ball.color, alpha: 1 });

      // Add highlight
      graphics.circle(-ball.radius * 0.3, -ball.radius * 0.3, ball.radius * 0.3);
      graphics.fill({ color: 0xffffff, alpha: 0.3 });

      // Update position
      graphics.x = ball.x;
      graphics.y = ball.y;
    }
  }

  setState(state: BallState): void {
    this.state = state;
  }

  getState(): BallState {
    return this.state;
  }

  addBall(ball: Ball): void {
    this.state.balls.push(ball);
  }

  removeBall(ballId: string): void {
    this.state.balls = this.state.balls.filter((b) => b.id !== ballId);
  }

  clearBalls(): void {
    this.state.balls = [];
  }

  setGravity(gravity: number): void {
    this.state.gravity = gravity;
  }

  setFriction(friction: number): void {
    this.state.friction = friction;
  }

  setPaused(paused: boolean): void {
    this.state.paused = paused;
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    if (this.app) {
      this.app.renderer.background.color = THEME_COLORS[theme].background;
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  }

  destroy(): void {
    this.isDestroyed = true;

    // Clear ball graphics
    for (const graphics of this.ballGraphics.values()) {
      try {
        graphics.destroy();
      } catch (e) {
        console.warn("BallRenderer graphics destroy error:", e);
      }
    }
    this.ballGraphics.clear();

    // Destroy the app if it exists
    if (this.app) {
      try {
        // Remove canvas from DOM manually
        if (this.app.canvas && this.app.canvas.parentNode) {
          this.app.canvas.parentNode.removeChild(this.app.canvas);
        }
        this.app.destroy(true, { children: true, texture: true });
      } catch (e) {
        console.warn("BallRenderer destroy error:", e);
      }
    }

    this.app = null;
    this.container = null;
    this.isInitialized = false;
  }
}
