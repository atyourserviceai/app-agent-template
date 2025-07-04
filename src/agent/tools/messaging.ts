import { tool } from "ai";
import { z } from "zod";

/**
 * Placeholder for messaging-related tools (e.g., sending emails, LinkedIn messages).
 * Mentioned in Step 1 directory structure plan.
 * Specific tools like 'messageLead' might be defined here or in crm-tools.ts.
 */

// Define a type for the messagingTools to include suggestActions
export const messagingTools = {
  sendEmail: tool({
    description: "Send an email to a recipient",
    execute: async ({ to, from: _from, subject, body: _body }) => {
      console.log(
        `Placeholder: sendEmail called to ${to} with subject "${subject}"`
      );
      // Placeholder logic:
      // Integrate with email service (SendGrid, Resend, etc.) using API key from env/config
      return "Email sent successfully";
    },
    parameters: z.object({
      body: z.string().describe("Body of the email"),
      from: z.string().optional().describe("Email address of the sender"),
      subject: z.string().describe("Subject of the email"),
      to: z.string().describe("Email address of the recipient"),
    }),
  }),

  sendLinkedInMessage: tool({
    description: "Send a message on LinkedIn",
    execute: async ({ profileUrl, message: _message }) => {
      console.log(
        `Placeholder: sendLinkedInMessage called for profile ${profileUrl}`
      );
      // Placeholder logic:
      // Integrate with LinkedIn API (requires app approval and careful handling)
      return "LinkedIn message sent successfully";
    },
    parameters: z.object({
      message: z.string().describe("Message to send"),
      profileUrl: z.string().describe("URL of the LinkedIn profile"),
    }),
  }),
};

// Export suggestActions using the tool() pattern with Zod schema
export const suggestActions = tool({
  description: "Suggest clickable action buttons for the user to respond with",
  execute: async ({ actions, includeOtherOption }) => {
    // If includeOtherOption is true and no button has isOther set, add an "Other..." option
    const processedActions = [...actions];

    if (
      includeOtherOption === true &&
      !actions.some((action) => action.isOther)
    ) {
      processedActions.push({
        isOther: true,
        label: "Other...",
        primary: false,
        value: "",
      });
    }

    return {
      actions: processedActions,
      message: "Action buttons displayed to user",
      success: true,
    };
  },
  parameters: z.object({
    actions: z
      .array(
        z.object({
          isOther: z
            .boolean()
            .optional()
            .describe(
              "Whether this is an 'Other' option that should focus the input field"
            ),
          label: z.string().describe("Button text to display"),
          primary: z
            .boolean()
            .optional()
            .describe(
              "Whether this is a primary action (true) or secondary action (false)"
            ),
          value: z
            .string()
            .describe(
              "Value to send when clicked (usually the text to send as a user message)"
            ),
        })
      )
      .describe("Array of action buttons to display to the user"),
    includeOtherOption: z
      .boolean()
      .optional()
      .describe(
        "Whether to include an 'Other...' option that allows the user to type a custom response"
      ),
  }),
});

// Placeholder for messagingExecutions if needed separately
// export const messagingExecutions = { ... };
