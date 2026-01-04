import type { UIMessage } from "ai";

// Approval string to be shared across frontend and backend
export const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied."
} as const;

/**
 * Extended UIMessage type that includes app-specific properties
 * These properties are used at runtime but not part of the base AI SDK UIMessage type
 */
export type ExtendedUIMessage = UIMessage & {
  /** Custom data attached to the message */
  data?: unknown;
  /** Timestamp when the message was created */
  createdAt?: Date | string;
};
