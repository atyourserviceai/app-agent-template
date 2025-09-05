import { ArrowClockwise, WarningOctagon } from "@phosphor-icons/react";
import { Avatar } from "@/components/avatar/Avatar";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";

type MissingResponseIndicatorProps = {
  onTryAgain: () => void;
  isLoading: boolean;
  formatTime: (date: Date) => string;
};

export function MissingResponseIndicator({
  onTryAgain,
  isLoading,
  formatTime
}: MissingResponseIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="flex gap-2 max-w-[85%] flex-row">
        <Avatar username={"AI"} />
        <div>
          <Card className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-bl-none">
            <div className="flex items-start gap-2 mb-2">
              <WarningOctagon
                weight="fill"
                className="text-yellow-500 dark:text-yellow-400 h-5 w-5 flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Missing Response
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  The assistant didn't provide a response to your last message
                </p>
                <Button
                  onClick={onTryAgain}
                  size="sm"
                  className="flex items-center gap-2 mt-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                  disabled={isLoading}
                >
                  <ArrowClockwise size={16} />
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
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
