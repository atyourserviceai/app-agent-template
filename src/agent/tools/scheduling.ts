import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from 'zod/v3';
import type { AppAgent } from "../AppAgent";

// Define a schedule input type
export type ScheduleInput = {
  type: "scheduled" | "delayed" | "cron" | "no-schedule";
  date?: Date;
  delayInSeconds?: number;
  cron?: string;
};

// Define our own schedule schema based on what we need
// Note: All fields must be required for OpenAI function calling compatibility
const scheduleSchema = z.object({
  description: z.string().describe("Description of the task to schedule"),
  when: z.object({
    cron: z.string().describe("Cron expression (required when type is 'cron')"),
    date: z.string().describe("ISO date string (required when type is 'scheduled')"),
    delayInSeconds: z.number().describe("Delay in seconds (required when type is 'delayed')"),
    type: z.enum(["scheduled", "delayed", "cron", "no-schedule"]).describe("Type of schedule")
  }).describe("Schedule timing configuration")
});

/**
 * Tool for scheduling a task to be executed at a specific time
 */
export const scheduleTask = tool({
  description: "Schedule a task to be executed at a later time",
  inputSchema: scheduleSchema,
  execute: async ({ when, description }) => {
    const { agent } = getCurrentAgent<AppAgent>();
    if (!agent) {
      throw new Error("No agent found");
    }

    function throwError(msg: string): string {
      throw new Error(msg);
    }

    // Parse the when object - it comes from the schema as strings
    const scheduleType = when.type;

    if (scheduleType === "no-schedule") {
      return "Not a valid schedule input";
    }

    const input =
      scheduleType === "scheduled"
        ? when.date // scheduled - ISO date string
        : scheduleType === "delayed"
          ? when.delayInSeconds // delayed
          : scheduleType === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");

    try {
      const scheduleResult = await agent.schedule(
        input!,
        "executeTask",
        description
      );
      return `Task scheduled for type "${scheduleType}": ${input} with ID: ${scheduleResult.id}`;
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
  }
});

/**
 * Tool for retrieving scheduled tasks
 */
export const getScheduledTasks = tool({
  description: "Get all scheduled tasks for the agent",
  inputSchema: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<AppAgent>();
    if (!agent) {
      throw new Error("No agent found");
    }

    try {
      const tasks = agent.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return JSON.stringify(tasks);
    } catch (error) {
      console.error("Error retrieving scheduled tasks", error);
      return `Error retrieving tasks: ${error}`;
    }
  }
});

/**
 * Tool for canceling a scheduled task
 */
export const cancelScheduledTask = tool({
  description: "Cancel a previously scheduled task",
  inputSchema: z.object({
    taskId: z.string()
  }),
  execute: async ({ taskId }) => {
    const { agent } = getCurrentAgent<AppAgent>();
    if (!agent) {
      throw new Error("No agent found");
    }

    try {
      // Cancel in the agent's schedule system
      await agent.cancelSchedule(taskId);
      return `Task ${taskId} has been canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task: ${error}`;
    }
  }
});
