import { Avatar } from "@/components/avatar/Avatar";
import { Card } from "@/components/card/Card";
import { useState } from "react";

type LoadingIndicatorProps = {
  formatTime: (date: Date) => string;
  isThinking?: boolean;
  thinkingTokens?: string;
};

export function LoadingIndicator({
  formatTime,
  isThinking = false,
  thinkingTokens
}: LoadingIndicatorProps) {
  const [showThinking, setShowThinking] = useState(false);
  return (
    <div className="flex justify-start">
      <div className="flex gap-2 max-w-[85%] flex-row">
        <Avatar username={"AI"} />
        <div>
          <Card className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 rounded-bl-none">
            {isThinking ? (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse"
                    style={{ animationDelay: "300ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse"
                    style={{ animationDelay: "600ms" }}
                  />
                </div>
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  Thinking...
                </span>
                {thinkingTokens && (
                  <button
                    type="button"
                    onClick={() => setShowThinking(!showThinking)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 ml-2"
                    title="Toggle thinking process"
                  >
                    {showThinking ? "🧠 Hide" : "🧠 Show"}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
                  style={{ animationDelay: "600ms" }}
                />
              </div>
            )}
          </Card>

          {/* Hidden thinking tokens display */}
          {isThinking && thinkingTokens && showThinking && (
            <Card className="mt-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="text-xs text-amber-800 dark:text-amber-200 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {thinkingTokens}
              </div>
            </Card>
          )}
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-muted-foreground text-left">
              {formatTime(new Date())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
