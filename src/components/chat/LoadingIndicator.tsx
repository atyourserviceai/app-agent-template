import { Avatar } from "@/components/avatar/Avatar";
import { Card } from "@/components/card/Card";

type LoadingIndicatorProps = {
  formatTime: (date: Date) => string;
};

export function LoadingIndicator({ formatTime }: LoadingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="flex gap-2 max-w-[85%] flex-row">
        <Avatar username={"AI"} />
        <div>
          <Card className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 rounded-bl-none">
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
