/**
 * Ball simulation types
 */

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  radius: number;
  color: number; // hex color
}

export interface BallState {
  balls: Ball[];
  gravity: number;
  friction: number;
  paused: boolean;
}

export type Theme = "dark" | "light";

export const DEFAULT_BALL_STATE: BallState = {
  balls: [],
  gravity: 0.5,
  friction: 0.99,
  paused: false
};

// Predefined colors for balls
export const BALL_COLORS = {
  red: 0xff4444,
  orange: 0xff8844,
  yellow: 0xffcc00,
  green: 0x44ff44,
  blue: 0x4488ff,
  purple: 0x8844ff,
  pink: 0xff44aa,
  cyan: 0x44ffff,
  white: 0xffffff
};

export type BallColorName = keyof typeof BALL_COLORS;
