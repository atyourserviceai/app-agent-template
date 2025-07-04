import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod";
import type { AppAgent } from "../AppAgent";

// Define a schedule input type
export type ScheduleInput = {
  type: "scheduled" | "delayed" | "cron" | "no-schedule";
  date?: Date;
  delayInSeconds?: number;
  cron?: string;
};

// Define our own schedule schema based on what we need
const scheduleSchema = z.object({
  description: z.string(),
  when: z.object({
    cron: z.string().optional(),
    date: z.date().optional(),
    delayInSeconds: z.number().optional(),
    type: z.enum(["scheduled", "delayed", "cron", "no-schedule"]),
  }),
});

/**
 * Tool for scheduling a task to be executed at a specific time
 */
export const scheduleTask = tool({
  description: "Schedule a task to be executed at a later time",
  execute: async ({
    when,
    description,
  }: {
    when: ScheduleInput;
    description: string;
  }) => {
    const { agent } = getCurrentAgent<AppAgent>();
    if (!agent) {
      throw new Error("No agent found");
    }

    function throwError(msg: string): string {
      throw new Error(msg);
    }

    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }

    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");

    try {
      const scheduleResult = await agent.schedule(
        input!,
        "executeTask",
        description
      );
      return `Task scheduled for type "${when.type}": ${input} with ID: ${scheduleResult.id}`;
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
  },
  parameters: scheduleSchema,
});

/**
 * Tool for retrieving scheduled tasks
 */
export const getScheduledTasks = tool({
  description: "Get all scheduled tasks for the agent",
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
  },
  parameters: z.object({}),
});

/**
 * Tool for canceling a scheduled task
 */
export const cancelScheduledTask = tool({
  description: "Cancel a previously scheduled task",
  execute: async ({ taskId }: { taskId: string }) => {
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
  },
  parameters: z.object({
    taskId: z.string(),
  }),
});
