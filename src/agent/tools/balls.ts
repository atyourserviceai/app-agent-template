/**
 * Ball manipulation tools for the AI agent
 * Uses command pattern - tools push commands to state, client executes them
 */

import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod/v3";
import type { AppAgent, AppAgentState } from "../AppAgent";
import { BALL_COLORS, type Ball, type BallColorName, type BallCommand } from "../../balls/types";

/**
 * Helper to add a command to the agent state
 */
function pushCommand(agent: AppAgent, command: BallCommand) {
  const state = agent.state as AppAgentState;
  if (!state.ballCommands) {
    state.ballCommands = [];
  }
  state.ballCommands.push(command);
  agent.setState(state);
}

/**
 * Add a new ball to the simulation
 */
export const addBall = tool({
  description:
    "Add a new bouncing ball to the simulation. You can specify color, size, position, and initial velocity.",
  execute: async ({
    color = "blue",
    radius = 25,
    x,
    y,
    vx = 0,
    vy = 0
  }: {
    color?: BallColorName;
    radius?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
  }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    const newBall: Ball = {
      id: `ball-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: x ?? Math.random() * 400 + 100,
      y: y ?? Math.random() * 200 + 50,
      vx: vx ?? (Math.random() - 0.5) * 10,
      vy: vy ?? (Math.random() - 0.5) * 5,
      radius: Math.max(10, Math.min(100, radius)),
      color: BALL_COLORS[color] || BALL_COLORS.blue
    };

    pushCommand(agent, { type: "addBall", ball: newBall });

    return {
      success: true,
      message: `Added a ${color} ball with radius ${newBall.radius}`,
      ballId: newBall.id
    };
  },
  inputSchema: z.object({
    color: z
      .enum(["red", "orange", "yellow", "green", "blue", "purple", "pink", "cyan", "white"])
      .optional()
      .describe("Color of the ball"),
    radius: z.number().min(10).max(100).optional().describe("Radius of the ball in pixels (10-100)"),
    x: z.number().optional().describe("Initial X position"),
    y: z.number().optional().describe("Initial Y position"),
    vx: z.number().optional().describe("Initial X velocity"),
    vy: z.number().optional().describe("Initial Y velocity")
  })
});

/**
 * Remove a ball from the simulation
 */
export const removeBall = tool({
  description: "Remove a specific ball from the simulation by its ID",
  execute: async ({ ballId }: { ballId: string }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    pushCommand(agent, { type: "removeBall", ballId });

    return {
      success: true,
      message: `Removed ball ${ballId}`
    };
  },
  inputSchema: z.object({
    ballId: z.string().describe("ID of the ball to remove")
  })
});

/**
 * Clear all balls from the simulation
 */
export const clearBalls = tool({
  description: "Remove all balls from the simulation",
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    pushCommand(agent, { type: "clearBalls" });

    return {
      success: true,
      message: "Cleared all balls from the simulation"
    };
  },
  inputSchema: z.object({})
});

/**
 * Set the gravity for the ball simulation
 */
export const setGravity = tool({
  description:
    "Set the gravity strength for the ball simulation. 0 = no gravity (floating), 0.5 = normal, 1+ = heavy gravity",
  execute: async ({ gravity }: { gravity: number }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    const clampedGravity = Math.max(0, Math.min(2, gravity));
    pushCommand(agent, { type: "setGravity", gravity: clampedGravity });

    return {
      success: true,
      message: `Set gravity to ${clampedGravity}`,
      gravity: clampedGravity
    };
  },
  inputSchema: z.object({
    gravity: z.number().min(0).max(2).describe("Gravity strength (0 = floating, 0.5 = normal, 2 = heavy)")
  })
});

/**
 * Pause or resume the ball simulation
 */
export const toggleSimulation = tool({
  description: "Pause or resume the ball simulation",
  execute: async ({ paused }: { paused: boolean }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    pushCommand(agent, { type: "setPaused", paused });

    return {
      success: true,
      message: paused ? "Simulation paused" : "Simulation resumed",
      paused
    };
  },
  inputSchema: z.object({
    paused: z.boolean().describe("True to pause, false to resume")
  })
});

/**
 * Get the current ball simulation state
 * Note: This returns info about what commands have been sent, not actual canvas state
 */
export const getBallState = tool({
  description: "Get information about pending ball commands",
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    const state = agent.state as AppAgentState;
    const pendingCommands = state.ballCommands?.length || 0;

    return {
      pendingCommands,
      message: pendingCommands > 0
        ? `${pendingCommands} commands pending`
        : "No pending commands - simulation running"
    };
  },
  inputSchema: z.object({})
});

/**
 * Add multiple balls at once
 */
export const addMultipleBalls = tool({
  description: "Add multiple balls to the simulation at once",
  execute: async ({ count, color }: { count: number; color?: BallColorName }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    const colors = Object.keys(BALL_COLORS) as BallColorName[];
    const balls: Ball[] = [];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const ballColor = color || colors[Math.floor(Math.random() * colors.length)];
      balls.push({
        id: `ball-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: Math.random() * 400 + 100,
        y: Math.random() * 200 + 50,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 10,
        radius: Math.random() * 20 + 15,
        color: BALL_COLORS[ballColor]
      });
    }

    pushCommand(agent, { type: "addBalls", balls });

    return {
      success: true,
      message: `Added ${balls.length} balls`,
      count: balls.length
    };
  },
  inputSchema: z.object({
    count: z.number().min(1).max(20).describe("Number of balls to add (1-20)"),
    color: z
      .enum(["red", "orange", "yellow", "green", "blue", "purple", "pink", "cyan", "white"])
      .optional()
      .describe("Color for all balls (random if not specified)")
  })
});
