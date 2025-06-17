import { Card } from "@/components/card/Card";
import { Robot } from "@phosphor-icons/react";

type EmptyChatProps = {
  message?: string;
};

export function EmptyChat({
  message = "Type a message below to begin chatting with your AI assistant",
}: EmptyChatProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <Card className="p-6 max-w-md mx-auto bg-neutral-100 dark:bg-neutral-900">
        <div className="text-center space-y-4">
          <div className="bg-[#F48120]/10 text-[#F48120] rounded-full p-3 inline-flex">
            <Robot size={24} />
          </div>
          <h3 className="font-semibold text-xl">Start a conversation</h3>
          <p className="text-muted-foreground text-base">{message}</p>
        </div>
      </Card>
    </div>
  );
}
