export interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: "call" | "result" | "partial-call";
  step?: number;
  args: Record<string, unknown>;
  result?: {
    content?: Array<{ type: string; text: string }>;
    actions?: Array<{
      label: string;
      value: string;
      primary?: boolean;
      isOther?: boolean;
    }>;
    success?: boolean;
    error?: {
      message: string;
      details?: string;
      timestamp: string;
    };
  };
}
