/**
 * BallRenderer - PixiJS renderer for bouncing balls simulation
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

// Random color palette for balls
const BALL_COLORS = [
  0xff6b6b, // Red
  0x4ecdc4, // Teal
  0xffe66d, // Yellow
  0x95e1d3, // Mint
  0xf38181, // Coral
  0xaa96da, // Purple
  0xfcbad3, // Pink
  0xa8d8ea, // Light blue
  0xff9f43, // Orange
  0x26de81 // Green
];

interface BallRendererOptions {
  onBallClick?: (ballId: string) => void;
  onBallAdd?: (ball: Ball) => void;
}

export class BallRenderer {
  private app: Application | null = null;
  private container: Container | null = null;
  private ballGraphics: Map<string, Graphics> = new Map();
  private options: BallRendererOptions;
  private balls: Ball[] = [];
  private gravity = 0.02;
  private gravityAngle = Math.PI / 2;
  private friction = 0.998;
  private paused = false;
  private theme: Theme = "dark";
  private width = 800;
  private height = 600;
  private isInitialized = false;
  private isDestroyed = false;

  // Drag state
  private draggedBall: Ball | null = null;
  private dragStartPos: { x: number; y: number } | null = null;
  private dragCurrentPos: { x: number; y: number } | null = null;
  private lastDragPositions: { x: number; y: number; time: number }[] = [];

  // Gravity direction change timer
  private gravityChangeInterval: ReturnType<typeof setInterval> | null = null;

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

    // Set up stage interaction for click-to-create
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = { contains: () => true };
    this.app.stage.on("pointerdown", this.onStagePointerDown.bind(this));
    this.app.stage.on("pointermove", this.onStagePointerMove.bind(this));
    this.app.stage.on("pointerup", this.onStagePointerUp.bind(this));
    this.app.stage.on("pointerupoutside", this.onStagePointerUp.bind(this));

    // Start animation loop using PixiJS ticker
    this.app.ticker.add(this.tick.bind(this));

    // Add some initial balls for visual interest
    this.addInitialBalls();

    // Start random gravity direction changes every 5 seconds
    this.startGravityChanges();

    this.isInitialized = true;
  }

  private startGravityChanges(): void {
    this.gravityChangeInterval = setInterval(() => {
      if (!this.paused) {
        this.gravityAngle = Math.random() * Math.PI * 2;
      }
    }, 5000);
  }

  private addInitialBalls(): void {
    const numBalls = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numBalls; i++) {
      const ball = this.createRandomBall();
      this.balls.push(ball);
    }
  }

  private createRandomBall(x?: number, y?: number): Ball {
    const radius = 15 + Math.random() * 25;
    const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];

    return {
      id: `ball-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: x ?? radius + Math.random() * (this.width - radius * 2),
      y: y ?? radius + Math.random() * (this.height - radius * 2),
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius,
      color
    };
  }

  private onStagePointerDown(event: any): void {
    const pos = event.global;

    // Check if clicking on an existing ball
    for (const ball of this.balls) {
      const dx = pos.x - ball.x;
      const dy = pos.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ball.radius) {
        this.draggedBall = ball;
        this.dragStartPos = { x: pos.x, y: pos.y };
        this.dragCurrentPos = { x: pos.x, y: pos.y };
        this.lastDragPositions = [{ x: pos.x, y: pos.y, time: Date.now() }];
        ball.vx = 0;
        ball.vy = 0;
        return;
      }
    }

    // Not clicking on a ball - create a new one
    const newBall = this.createRandomBall(pos.x, pos.y);
    newBall.vx = 0;
    newBall.vy = 0;
    this.balls.push(newBall);
    this.options.onBallAdd?.(newBall);
  }

  private onStagePointerMove(event: any): void {
    if (!this.draggedBall) return;

    const pos = event.global;
    this.dragCurrentPos = { x: pos.x, y: pos.y };
    this.draggedBall.x = pos.x;
    this.draggedBall.y = pos.y;
    this.lastDragPositions.push({ x: pos.x, y: pos.y, time: Date.now() });

    if (this.lastDragPositions.length > 5) {
      this.lastDragPositions.shift();
    }
  }

  private onStagePointerUp(): void {
    if (!this.draggedBall) return;

    if (this.lastDragPositions.length >= 2) {
      const recent = this.lastDragPositions.slice(-3);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.time - first.time) / 1000;

      if (dt > 0) {
        const scale = 1.5;
        this.draggedBall.vx = ((last.x - first.x) / dt) * scale * 0.016;
        this.draggedBall.vy = ((last.y - first.y) / dt) * scale * 0.016;

        const maxVel = 30;
        this.draggedBall.vx = Math.max(
          -maxVel,
          Math.min(maxVel, this.draggedBall.vx)
        );
        this.draggedBall.vy = Math.max(
          -maxVel,
          Math.min(maxVel, this.draggedBall.vy)
        );
      }
    }

    this.draggedBall = null;
    this.dragStartPos = null;
    this.dragCurrentPos = null;
    this.lastDragPositions = [];
  }

  private tick(): void {
    if (!this.paused) {
      this.updatePhysics();
    }
    this.render();
  }

  private updatePhysics(): void {
    const gravityX = Math.cos(this.gravityAngle) * this.gravity;
    const gravityY = Math.sin(this.gravityAngle) * this.gravity;

    for (const ball of this.balls) {
      if (ball === this.draggedBall) continue;

      ball.vx += gravityX;
      ball.vy += gravityY;
      ball.vx *= this.friction;
      ball.vy *= this.friction;
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

    const currentBallIds = new Set(this.balls.map((b) => b.id));

    // Remove graphics for balls that no longer exist
    for (const [id, graphics] of this.ballGraphics) {
      if (!currentBallIds.has(id)) {
        this.container.removeChild(graphics);
        graphics.destroy();
        this.ballGraphics.delete(id);
      }
    }

    // Update or create graphics for each ball
    for (const ball of this.balls) {
      let graphics = this.ballGraphics.get(ball.id);

      if (!graphics) {
        graphics = new Graphics();
        graphics.eventMode = "static";
        graphics.cursor = "grab";
        this.container.addChild(graphics);
        this.ballGraphics.set(ball.id, graphics);
      }

      graphics.cursor = ball === this.draggedBall ? "grabbing" : "grab";
      graphics.clear();
      graphics.circle(0, 0, ball.radius);
      graphics.fill({ color: ball.color, alpha: 1 });
      graphics.circle(
        -ball.radius * 0.3,
        -ball.radius * 0.3,
        ball.radius * 0.3
      );
      graphics.fill({ color: 0xffffff, alpha: 0.3 });
      graphics.x = ball.x;
      graphics.y = ball.y;
    }
  }

  // Public API - these methods can be called from outside
  getState(): BallState {
    return {
      balls: this.balls,
      gravity: this.gravity,
      gravityAngle: this.gravityAngle,
      friction: this.friction,
      paused: this.paused
    };
  }

  addBall(ball: Ball): void {
    // Ensure ball has valid position within bounds
    ball.x = Math.max(ball.radius, Math.min(this.width - ball.radius, ball.x));
    ball.y = Math.max(ball.radius, Math.min(this.height - ball.radius, ball.y));
    this.balls.push(ball);
  }

  removeBall(ballId: string): void {
    this.balls = this.balls.filter((b) => b.id !== ballId);
  }

  clearBalls(): void {
    this.balls = [];
  }

  setGravity(gravity: number): void {
    this.gravity = gravity;
  }

  setGravityAngle(angle: number): void {
    this.gravityAngle = angle;
  }

  setFriction(friction: number): void {
    this.friction = friction;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
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

    if (this.gravityChangeInterval) {
      clearInterval(this.gravityChangeInterval);
      this.gravityChangeInterval = null;
    }

    for (const graphics of this.ballGraphics.values()) {
      try {
        graphics.destroy();
      } catch (e) {
        console.warn("BallRenderer graphics destroy error:", e);
      }
    }
    this.ballGraphics.clear();

    if (this.app) {
      try {
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
