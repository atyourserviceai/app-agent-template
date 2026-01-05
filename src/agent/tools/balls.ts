/**
 * Ball manipulation tools for the AI agent
 */

import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod/v3";
import type { AppAgent, AppAgentState } from "../AppAgent";
import { BALL_COLORS, type Ball, type BallColorName } from "../../balls/types";

/**
 * Add a new ball to the simulation
 */
export const addBall = tool({
  description:
    "Add a new bouncing ball to the simulation. You can specify color, size, position, and initial velocity.",
  execute: async ({
    color = "blue",
    radius = 20,
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

    try {
      const state = agent.state as AppAgentState;

      // Initialize ball state if needed
      if (!state.ballState) {
        state.ballState = {
          balls: [],
          gravity: 0.5,
          friction: 0.99,
          paused: false
        };
      }

      // Generate random position if not specified
      const newBall: Ball = {
        id: `ball-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: x ?? Math.random() * 400 + 100,
        y: y ?? Math.random() * 200 + 50,
        vx: vx ?? (Math.random() - 0.5) * 10,
        vy: vy ?? (Math.random() - 0.5) * 5,
        radius: Math.max(10, Math.min(100, radius)),
        color: BALL_COLORS[color] || BALL_COLORS.blue
      };

      state.ballState.balls.push(newBall);
      agent.setState(state);

      return {
        success: true,
        message: `Added a ${color} ball with radius ${newBall.radius}`,
        ballId: newBall.id,
        totalBalls: state.ballState.balls.length
      };
    } catch (error) {
      console.error("Error adding ball:", error);
      return `Error adding ball: ${error}`;
    }
  },
  inputSchema: z.object({
    color: z
      .enum([
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "purple",
        "pink",
        "cyan",
        "white"
      ])
      .optional()
      .describe("Color of the ball"),
    radius: z
      .number()
      .min(10)
      .max(100)
      .optional()
      .describe("Radius of the ball in pixels (10-100)"),
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

    try {
      const state = agent.state as AppAgentState;

      if (!state.ballState?.balls.length) {
        return { success: false, message: "No balls to remove" };
      }

      const initialCount = state.ballState.balls.length;
      state.ballState.balls = state.ballState.balls.filter(
        (b) => b.id !== ballId
      );
      agent.setState(state);

      if (state.ballState.balls.length < initialCount) {
        return {
          success: true,
          message: `Removed ball ${ballId}`,
          remainingBalls: state.ballState.balls.length
        };
      } else {
        return { success: false, message: `Ball ${ballId} not found` };
      }
    } catch (error) {
      console.error("Error removing ball:", error);
      return `Error removing ball: ${error}`;
    }
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

    try {
      const state = agent.state as AppAgentState;
      const count = state.ballState?.balls.length || 0;

      if (!state.ballState) {
        state.ballState = {
          balls: [],
          gravity: 0.5,
          friction: 0.99,
          paused: false
        };
      } else {
        state.ballState.balls = [];
      }

      agent.setState(state);

      return {
        success: true,
        message: `Cleared ${count} balls from the simulation`
      };
    } catch (error) {
      console.error("Error clearing balls:", error);
      return `Error clearing balls: ${error}`;
    }
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

    try {
      const state = agent.state as AppAgentState;

      if (!state.ballState) {
        state.ballState = {
          balls: [],
          gravity: 0.5,
          friction: 0.99,
          paused: false
        };
      }

      state.ballState.gravity = Math.max(0, Math.min(2, gravity));
      agent.setState(state);

      return {
        success: true,
        message: `Set gravity to ${state.ballState.gravity}`,
        gravity: state.ballState.gravity
      };
    } catch (error) {
      console.error("Error setting gravity:", error);
      return `Error setting gravity: ${error}`;
    }
  },
  inputSchema: z.object({
    gravity: z
      .number()
      .min(0)
      .max(2)
      .describe("Gravity strength (0 = floating, 0.5 = normal, 2 = heavy)")
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

    try {
      const state = agent.state as AppAgentState;

      if (!state.ballState) {
        state.ballState = {
          balls: [],
          gravity: 0.5,
          friction: 0.99,
          paused: false
        };
      }

      state.ballState.paused = paused;
      agent.setState(state);

      return {
        success: true,
        message: paused ? "Simulation paused" : "Simulation resumed",
        paused: state.ballState.paused
      };
    } catch (error) {
      console.error("Error toggling simulation:", error);
      return `Error toggling simulation: ${error}`;
    }
  },
  inputSchema: z.object({
    paused: z.boolean().describe("True to pause, false to resume")
  })
});

/**
 * Get the current ball simulation state
 */
export const getBallState = tool({
  description:
    "Get the current state of the ball simulation including all balls and physics settings",
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const state = agent.state as AppAgentState;
      const ballState = state.ballState || {
        balls: [],
        gravity: 0.5,
        friction: 0.99,
        paused: false
      };

      return {
        totalBalls: ballState.balls.length,
        balls: ballState.balls.map((b) => ({
          id: b.id,
          color: Object.entries(BALL_COLORS).find(
            ([, v]) => v === b.color
          )?.[0] || "unknown",
          radius: b.radius,
          position: { x: Math.round(b.x), y: Math.round(b.y) }
        })),
        gravity: ballState.gravity,
        friction: ballState.friction,
        paused: ballState.paused
      };
    } catch (error) {
      console.error("Error getting ball state:", error);
      return `Error getting ball state: ${error}`;
    }
  },
  inputSchema: z.object({})
});

/**
 * Add multiple balls at once
 */
export const addMultipleBalls = tool({
  description: "Add multiple balls to the simulation at once",
  execute: async ({
    count,
    color
  }: {
    count: number;
    color?: BallColorName;
  }) => {
    const { agent } = getCurrentAgent<AppAgent>();

    if (!agent) {
      return "Error: Could not get agent reference";
    }

    try {
      const state = agent.state as AppAgentState;

      if (!state.ballState) {
        state.ballState = {
          balls: [],
          gravity: 0.5,
          friction: 0.99,
          paused: false
        };
      }

      const colors = Object.keys(BALL_COLORS) as BallColorName[];
      const addedBalls: string[] = [];

      for (let i = 0; i < Math.min(count, 20); i++) {
        const ballColor = color || colors[Math.floor(Math.random() * colors.length)];
        const newBall: Ball = {
          id: `ball-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: Math.random() * 400 + 100,
          y: Math.random() * 200 + 50,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 10,
          radius: Math.random() * 20 + 15,
          color: BALL_COLORS[ballColor]
        };
        state.ballState.balls.push(newBall);
        addedBalls.push(newBall.id);
      }

      agent.setState(state);

      return {
        success: true,
        message: `Added ${addedBalls.length} balls`,
        totalBalls: state.ballState.balls.length
      };
    } catch (error) {
      console.error("Error adding multiple balls:", error);
      return `Error adding multiple balls: ${error}`;
    }
  },
  inputSchema: z.object({
    count: z
      .number()
      .min(1)
      .max(20)
      .describe("Number of balls to add (1-20)"),
    color: z
      .enum([
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "purple",
        "pink",
        "cyan",
        "white"
      ])
      .optional()
      .describe("Color for all balls (random if not specified)")
  })
});
