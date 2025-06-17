import { Avatar } from "@/components/avatar/Avatar";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { ArrowClockwise, WarningOctagon } from "@phosphor-icons/react";

type ErrorMessageProps = {
  errorData: {
    message: string;
    details: string;
    timestamp: string;
  };
  onRetry: () => void;
  isLoading: boolean;
  formatTime: (date: Date) => string;
  createdAt: Date | string | undefined;
};

export function ErrorMessage({
  errorData,
  onRetry,
  isLoading,
  formatTime,
  createdAt,
}: ErrorMessageProps) {
  // Default to current date if createdAt is undefined
  const displayDate = createdAt ? new Date(createdAt) : new Date();

  return (
    <div className="flex justify-start">
      <div className="flex gap-2 max-w-[85%] flex-row">
        <Avatar username={"AI"} />
        <div>
          <Card className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-bl-none">
            <div className="flex items-start gap-2 mb-2">
              <WarningOctagon
                weight="fill"
                className="text-red-500 dark:text-red-400 h-5 w-5 flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Response Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {errorData.message}
                </p>
                <details className="mt-2" open>
                  <summary className="cursor-pointer text-xs">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-red-100 dark:bg-red-900/30 rounded">
                    {errorData.details}
                  </pre>
                </details>
                <Button
                  onClick={onRetry}
                  size="sm"
                  className="flex items-center gap-2 mt-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                  disabled={isLoading}
                >
                  <ArrowClockwise size={16} />
                  Retry Message
                </Button>
              </div>
            </div>
          </Card>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-muted-foreground text-left">
              {formatTime(displayDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
