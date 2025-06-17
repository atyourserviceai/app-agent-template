/**
 * Tool Utilities
 *
 * This file contains helper functions for working with tools that are safe
 * to import in React components. These are kept separate from registry.ts to avoid
 * importing Cloudflare Worker code in the browser.
 */

// Log that the utils file is loaded
console.log("[utils] Tool utility functions loaded");

/**
 * Tool categories for classifying tools
 */
export enum ToolCategory {
  CONTEXT = "Context",
  BROWSER = "Browser",
  MESSAGING = "Messaging",
  SCHEDULING = "Scheduling",
  CRM = "CRM",
  ONBOARDING = "Onboarding",
  TESTING = "Testing",
  STATE = "State",
  SEARCH = "Search",
  EMAIL = "Email",
  OTHER = "Other",
}

/**
 * Tool metadata interface
 */
interface ToolMetadata {
  friendlyName: string;
  category: ToolCategory;
  icon?: string;
  description?: string;
}

/**
 * Central registry of tool metadata
 * This provides a single source of truth for tool names, categories, and other metadata
 */
export const toolRegistry: Record<string, ToolMetadata> = {
  // Context tools
  getWeatherInformation: {
    friendlyName: "Get Weather Information",
    category: ToolCategory.CONTEXT,
    icon: "cloud",
  },
  getLocalTime: {
    friendlyName: "Get Local Time",
    category: ToolCategory.CONTEXT,
    icon: "clock",
  },

  // Browser tools
  browseWebPage: {
    friendlyName: "Browse Web Page",
    category: ToolCategory.BROWSER,
    icon: "globe",
  },
  browseWithBrowserbase: {
    friendlyName: "Browse With Browserbase",
    category: ToolCategory.BROWSER,
    icon: "globe",
  },
  fetchWebPage: {
    friendlyName: "Fetch Web Page",
    category: ToolCategory.BROWSER,
    icon: "download",
  },

  // Scheduling tools
  scheduleTask: {
    friendlyName: "Schedule Task",
    category: ToolCategory.SCHEDULING,
    icon: "calendar-plus",
  },
  getScheduledTasks: {
    friendlyName: "Get Scheduled Tasks",
    category: ToolCategory.SCHEDULING,
    icon: "calendar",
  },
  cancelScheduledTask: {
    friendlyName: "Cancel Scheduled Task",
    category: ToolCategory.SCHEDULING,
    icon: "calendar-x",
  },

  // CRM tools
  createLead: {
    friendlyName: "Create Lead",
    category: ToolCategory.CRM,
    icon: "user-plus",
  },
  updateLead: {
    friendlyName: "Update Lead",
    category: ToolCategory.CRM,
    icon: "user-edit",
  },
  searchLeads: {
    friendlyName: "Search Leads",
    category: ToolCategory.CRM,
    icon: "search",
  },

  // Messaging tools
  suggestActions: {
    friendlyName: "Suggest Actions",
    category: ToolCategory.MESSAGING,
    icon: "list-check",
  },

  // Testing tools
  recordTestResult: {
    friendlyName: "Record Test Result",
    category: ToolCategory.TESTING,
    icon: "clipboard-check",
  },
  documentTool: {
    friendlyName: "Document Tool",
    category: ToolCategory.TESTING,
    icon: "file-text",
  },
  generateTestReport: {
    friendlyName: "Generate Test Report",
    category: ToolCategory.TESTING,
    icon: "file-chart",
  },
  controlledErrorTool: {
    friendlyName: "Controlled Error Tool",
    category: ToolCategory.TESTING,
    icon: "bug",
  },

  // Error testing tool
  testErrorTool: {
    friendlyName: "Test Error Tool",
    category: ToolCategory.TESTING,
    icon: "bug",
  },

  // Gmail tools
  GMAIL_CREATE_EMAIL_DRAFT: {
    friendlyName: "Create Email Draft",
    category: ToolCategory.EMAIL,
    icon: "envelope-plus",
  },
  GMAIL_SEND_EMAIL: {
    friendlyName: "Send Email",
    category: ToolCategory.EMAIL,
    icon: "envelope",
  },
  GMAIL_FETCH_EMAILS: {
    friendlyName: "Fetch Emails",
    category: ToolCategory.EMAIL,
    icon: "envelope-download",
  },
  GMAIL_GET_CONTACTS: {
    friendlyName: "Get Contacts",
    category: ToolCategory.EMAIL,
    icon: "address-book",
  },
  GMAIL_LIST_DRAFTS: {
    friendlyName: "List Email Drafts",
    category: ToolCategory.EMAIL,
    icon: "clipboard-list",
  },
  GMAIL_MOVE_TO_TRASH: {
    friendlyName: "Move Email to Trash",
    category: ToolCategory.EMAIL,
    icon: "trash",
  },
  GMAIL_REPLY_TO_THREAD: {
    friendlyName: "Reply to Email Thread",
    category: ToolCategory.EMAIL,
    icon: "reply",
  },
  GMAIL_SEARCH_PEOPLE: {
    friendlyName: "Search People",
    category: ToolCategory.EMAIL,
    icon: "users-magnifying-glass",
  },
  GMAIL_DELETE_DRAFT: {
    friendlyName: "Delete Email Draft",
    category: ToolCategory.EMAIL,
    icon: "trash",
  },
  GMAIL_DELETE_MESSAGE: {
    friendlyName: "Delete Email Message",
    category: ToolCategory.EMAIL,
    icon: "trash",
  },

  // Add more tools as needed...
};

/**
 * Get a human-friendly name for a tool based on its technical name
 *
 * @param toolName The technical name of the tool (e.g., "getWeatherInformation")
 * @returns A formatted human-friendly name (e.g., "Get Weather Information")
 */
export function getFriendlyToolName(toolName: string): string {
  // Check if the tool exists in our registry
  if (toolName in toolRegistry) {
    return toolRegistry[toolName].friendlyName;
  }

  // Fallback for tools not in registry: convert camelCase or SNAKE_CASE to Title Case
  return (
    toolName
      // Handle SNAKE_CASE by replacing underscores with spaces
      .replace(/_/g, " ")
      // Insert space before uppercase letters (for camelCase)
      .replace(/([A-Z])/g, " $1")
      // Convert first character to uppercase and trim leading space
      .replace(/^./, (str) => str.toUpperCase())
      // Remove extra spaces that might have been introduced
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Get the category for a tool based on its name
 *
 * @param toolName The technical name of the tool
 * @returns The category of the tool
 */
export function getToolCategory(toolName: string): ToolCategory {
  // Check if the tool exists in our registry
  if (toolName in toolRegistry) {
    return toolRegistry[toolName].category;
  }

  // Default category for unknown tools
  return ToolCategory.OTHER;
}

/**
 * Get an icon name for a tool based on its name
 *
 * @param toolName The technical name of the tool
 * @returns An icon name that can be used with your icon component
 */
export function getToolIconByName(toolName: string): string {
  if (toolName in toolRegistry && toolRegistry[toolName].icon) {
    return toolRegistry[toolName].icon || "tool";
  }

  // If tool doesn't have an icon defined, use the category icon
  if (toolName in toolRegistry) {
    return getCategoryIcon(toolRegistry[toolName].category);
  }

  // Default icon for unknown tools
  return "tool";
}

/**
 * Get an icon name for a tool category
 *
 * @param category The tool category
 * @returns An icon name that can be used with your icon component
 */
export function getCategoryIcon(category: ToolCategory): string {
  switch (category) {
    case ToolCategory.BROWSER:
      return "globe";
    case ToolCategory.CONTEXT:
      return "info-circle";
    case ToolCategory.MESSAGING:
      return "chat";
    case ToolCategory.SCHEDULING:
      return "calendar";
    case ToolCategory.CRM:
      return "users";
    case ToolCategory.ONBOARDING:
      return "clipboard";
    case ToolCategory.TESTING:
      return "bug";
    case ToolCategory.STATE:
      return "database";
    case ToolCategory.SEARCH:
      return "search";
    case ToolCategory.EMAIL:
      return "envelope";
    default:
      return "tool";
  }
}
