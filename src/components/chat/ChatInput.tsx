import { PaperPlaneRight } from "@phosphor-icons/react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/button/Button";
import { Textarea } from "@/components/textarea/Textarea";

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  pendingConfirmation: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  pendingConfirmation,
  placeholder,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      if (value === "") {
        textareaRef.current.style.height = "auto";
      } else {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }
  }, [value]);

  // Get appropriate placeholder text
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (pendingConfirmation)
      return "Please respond to the tool confirmation above...";
    if (isLoading) return "AI is thinking...";
    return "Type your message... (Shift+Enter for new line, Enter to send)";
  };

  // Handle key press events
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      className="p-3 bg-white dark:bg-neutral-900 absolute bottom-0 left-0 right-0 z-20 border-t border-neutral-300 dark:border-neutral-800 md:pb-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            disabled={pendingConfirmation || isLoading}
            placeholder={getPlaceholder()}
            className="pl-4 pr-10 py-2 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-transparent focus:border-border-neutral-300 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-[#F48120] rounded-full" />
            </div>
          )}
        </div>

        <Button
          type="submit"
          shape="square"
          className="rounded-full h-10 w-10 flex-shrink-0"
          disabled={pendingConfirmation || !value.trim() || isLoading}
        >
          <PaperPlaneRight size={16} />
        </Button>
      </div>
    </form>
  );
}
