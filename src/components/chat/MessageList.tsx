import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";

type MessageListProps = {
  children: ReactNode;
  className?: string;
};

export function MessageList({ children, className = "" }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevChildrenRef = useRef<ReactNode>(children);

  // Function to scroll to the bottom of the message list - memoized with useCallback
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom when children change (new messages added)
  useEffect(() => {
    // Only scroll if children have changed
    if (prevChildrenRef.current !== children) {
      // Check if there's no textarea (not in edit mode)
      if (
        containerRef.current &&
        !containerRef.current.querySelector("textarea")
      ) {
        scrollToBottom();
      }
      prevChildrenRef.current = children;
    }
  }, [children, scrollToBottom]);

  // Also scroll to bottom when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        containerRef.current &&
        !containerRef.current.querySelector("textarea")
      ) {
        scrollToBottom();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 pb-28 md:pb-24 max-h-[calc(100vh-10rem)] ${className}`}
    >
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
}
