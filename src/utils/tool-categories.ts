import { ToolCategory } from "@/agent/tools/utils";

export function getCategoryIcon(category: ToolCategory): string {
  switch (category) {
    case ToolCategory.BROWSER:
      return "🌐";
    case ToolCategory.CRM:
      return "👥";
    case ToolCategory.MESSAGING:
      return "✉️";
    case ToolCategory.ONBOARDING:
      return "🚀";
    case ToolCategory.SCHEDULING:
      return "📅";
    case ToolCategory.SEARCH:
      return "🔍";
    case ToolCategory.STATE:
      return "💾";
    case ToolCategory.TESTING:
      return "🧪";
    case ToolCategory.CONTEXT:
      return "🌍";
    case ToolCategory.EMAIL:
      return "📧";
    default:
      return "🔧";
  }
}
