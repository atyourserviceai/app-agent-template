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
  0x26de81  // Green
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
  private state: BallState = {
    balls: [],
    gravity: 0.02, // Almost zero gravity
    gravityAngle: Math.PI / 2, // Down by default
    friction: 0.998,
    paused: false
  };
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

    // Add initial random balls
    this.addInitialBalls();

    // Start random gravity direction changes every 5 seconds
    this.startGravityChanges();

    this.isInitialized = true;
  }

  private startGravityChanges(): void {
    // Change gravity direction randomly every 5 seconds
    this.gravityChangeInterval = setInterval(() => {
      if (!this.state.paused) {
        // Random angle between 0 and 2*PI
        this.state.gravityAngle = Math.random() * Math.PI * 2;
      }
    }, 5000);
  }

  private addInitialBalls(): void {
    const numBalls = 5 + Math.floor(Math.random() * 5); // 5-9 balls

    for (let i = 0; i < numBalls; i++) {
      const ball = this.createRandomBall();
      this.state.balls.push(ball);
    }
  }

  private createRandomBall(x?: number, y?: number): Ball {
    const radius = 15 + Math.random() * 25; // 15-40 radius
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
    for (const ball of this.state.balls) {
      const dx = pos.x - ball.x;
      const dy = pos.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ball.radius) {
        // Start dragging this ball
        this.draggedBall = ball;
        this.dragStartPos = { x: pos.x, y: pos.y };
        this.dragCurrentPos = { x: pos.x, y: pos.y };
        this.lastDragPositions = [{ x: pos.x, y: pos.y, time: Date.now() }];

        // Stop ball velocity while dragging
        ball.vx = 0;
        ball.vy = 0;
        return;
      }
    }

    // Not clicking on a ball - create a new one
    const newBall = this.createRandomBall(pos.x, pos.y);
    newBall.vx = 0;
    newBall.vy = 0;
    this.state.balls.push(newBall);
    this.options.onBallAdd?.(newBall);
  }

  private onStagePointerMove(event: any): void {
    if (!this.draggedBall) return;

    const pos = event.global;
    this.dragCurrentPos = { x: pos.x, y: pos.y };

    // Update ball position to follow cursor
    this.draggedBall.x = pos.x;
    this.draggedBall.y = pos.y;

    // Track positions for velocity calculation
    this.lastDragPositions.push({ x: pos.x, y: pos.y, time: Date.now() });

    // Keep only last 5 positions
    if (this.lastDragPositions.length > 5) {
      this.lastDragPositions.shift();
    }
  }

  private onStagePointerUp(_event: any): void {
    if (!this.draggedBall) return;

    // Calculate throw velocity from recent movement
    if (this.lastDragPositions.length >= 2) {
      const recent = this.lastDragPositions.slice(-3);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.time - first.time) / 1000; // Convert to seconds

      if (dt > 0) {
        // Scale velocity for a satisfying throw feel
        const scale = 1.5;
        this.draggedBall.vx = ((last.x - first.x) / dt) * scale * 0.016; // Convert to per-frame
        this.draggedBall.vy = ((last.y - first.y) / dt) * scale * 0.016;

        // Clamp velocity
        const maxVel = 30;
        this.draggedBall.vx = Math.max(-maxVel, Math.min(maxVel, this.draggedBall.vx));
        this.draggedBall.vy = Math.max(-maxVel, Math.min(maxVel, this.draggedBall.vy));
      }
    }

    // Clear drag state
    this.draggedBall = null;
    this.dragStartPos = null;
    this.dragCurrentPos = null;
    this.lastDragPositions = [];
  }

  private tick(): void {
    if (!this.state.paused) {
      this.updatePhysics();
    }
    this.render();
  }

  private updatePhysics(): void {
    // Calculate gravity components from magnitude and angle
    const gravityX = Math.cos(this.state.gravityAngle) * this.state.gravity;
    const gravityY = Math.sin(this.state.gravityAngle) * this.state.gravity;

    for (const ball of this.state.balls) {
      // Skip physics for dragged ball
      if (ball === this.draggedBall) continue;

      // Apply gravity in current direction
      ball.vx += gravityX;
      ball.vy += gravityY;

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
        graphics.cursor = "grab";
        this.container.addChild(graphics);
        this.ballGraphics.set(ball.id, graphics);
      }

      // Update cursor based on drag state
      graphics.cursor = ball === this.draggedBall ? "grabbing" : "grab";

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

  /**
   * Update state without resetting the simulation
   * Only updates physics parameters, not ball positions
   */
  setState(state: BallState): void {
    // Preserve existing balls if they exist, only update physics params
    if (this.state.balls.length > 0 && state.balls.length === 0) {
      // Don't clear balls if incoming state has empty balls array
      this.state.gravity = state.gravity;
      this.state.gravityAngle = state.gravityAngle;
      this.state.friction = state.friction;
      this.state.paused = state.paused;
    } else {
      this.state = state;
    }
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

  setGravityAngle(angle: number): void {
    this.state.gravityAngle = angle;
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

    // Clear gravity change interval
    if (this.gravityChangeInterval) {
      clearInterval(this.gravityChangeInterval);
      this.gravityChangeInterval = null;
    }

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
