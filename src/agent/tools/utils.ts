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
  // Browser tools
  browseWebPage: {
    category: ToolCategory.BROWSER,
    friendlyName: "Browse Web Page",
    icon: "globe",
  },
  browseWithBrowserbase: {
    category: ToolCategory.BROWSER,
    friendlyName: "Browse With Browserbase",
    icon: "globe",
  },
  cancelScheduledTask: {
    category: ToolCategory.SCHEDULING,
    friendlyName: "Cancel Scheduled Task",
    icon: "calendar-x",
  },
  controlledErrorTool: {
    category: ToolCategory.TESTING,
    friendlyName: "Controlled Error Tool",
    icon: "bug",
  },

  // CRM tools
  createLead: {
    category: ToolCategory.CRM,
    friendlyName: "Create Lead",
    icon: "user-plus",
  },
  documentTool: {
    category: ToolCategory.TESTING,
    friendlyName: "Document Tool",
    icon: "file-text",
  },
  fetchWebPage: {
    category: ToolCategory.BROWSER,
    friendlyName: "Fetch Web Page",
    icon: "download",
  },

  // Gmail tools
  GMAIL_CREATE_EMAIL_DRAFT: {
    category: ToolCategory.EMAIL,
    friendlyName: "Create Email Draft",
    icon: "envelope-plus",
  },
  GMAIL_DELETE_DRAFT: {
    category: ToolCategory.EMAIL,
    friendlyName: "Delete Email Draft",
    icon: "trash",
  },
  GMAIL_DELETE_MESSAGE: {
    category: ToolCategory.EMAIL,
    friendlyName: "Delete Email Message",
    icon: "trash",
  },
  GMAIL_FETCH_EMAILS: {
    category: ToolCategory.EMAIL,
    friendlyName: "Fetch Emails",
    icon: "envelope-download",
  },
  GMAIL_GET_CONTACTS: {
    category: ToolCategory.EMAIL,
    friendlyName: "Get Contacts",
    icon: "address-book",
  },
  GMAIL_LIST_DRAFTS: {
    category: ToolCategory.EMAIL,
    friendlyName: "List Email Drafts",
    icon: "clipboard-list",
  },
  GMAIL_MOVE_TO_TRASH: {
    category: ToolCategory.EMAIL,
    friendlyName: "Move Email to Trash",
    icon: "trash",
  },
  GMAIL_REPLY_TO_THREAD: {
    category: ToolCategory.EMAIL,
    friendlyName: "Reply to Email Thread",
    icon: "reply",
  },
  GMAIL_SEARCH_PEOPLE: {
    category: ToolCategory.EMAIL,
    friendlyName: "Search People",
    icon: "users-magnifying-glass",
  },
  GMAIL_SEND_EMAIL: {
    category: ToolCategory.EMAIL,
    friendlyName: "Send Email",
    icon: "envelope",
  },
  generateTestReport: {
    category: ToolCategory.TESTING,
    friendlyName: "Generate Test Report",
    icon: "file-chart",
  },
  getLocalTime: {
    category: ToolCategory.CONTEXT,
    friendlyName: "Get Local Time",
    icon: "clock",
  },
  getScheduledTasks: {
    category: ToolCategory.SCHEDULING,
    friendlyName: "Get Scheduled Tasks",
    icon: "calendar",
  },
  // Context tools
  getWeatherInformation: {
    category: ToolCategory.CONTEXT,
    friendlyName: "Get Weather Information",
    icon: "cloud",
  },

  // Testing tools
  recordTestResult: {
    category: ToolCategory.TESTING,
    friendlyName: "Record Test Result",
    icon: "clipboard-check",
  },

  // Scheduling tools
  scheduleTask: {
    category: ToolCategory.SCHEDULING,
    friendlyName: "Schedule Task",
    icon: "calendar-plus",
  },
  searchLeads: {
    category: ToolCategory.CRM,
    friendlyName: "Search Leads",
    icon: "search",
  },

  // Messaging tools
  suggestActions: {
    category: ToolCategory.MESSAGING,
    friendlyName: "Suggest Actions",
    icon: "list-check",
  },

  // Error testing tool
  testErrorTool: {
    category: ToolCategory.TESTING,
    friendlyName: "Test Error Tool",
    icon: "bug",
  },
  updateLead: {
    category: ToolCategory.CRM,
    friendlyName: "Update Lead",
    icon: "user-edit",
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
