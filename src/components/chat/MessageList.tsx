import { Children, type ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

type MessageListProps = {
  children: ReactNode;
  className?: string;
};

export function MessageList({ children, className = "" }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevChildCountRef = useRef<number>(0);
  const isUserScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user is near the bottom of the scroll container
  const isNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    const threshold = 150; // pixels from bottom
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  }, []);

  // Function to scroll to the bottom of the message list
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track user scroll activity
  const handleScroll = useCallback(() => {
    // Mark that user is scrolling
    isUserScrollingRef.current = true;

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset the flag after user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  }, []);

  // Count children to detect new messages
  const childCount = Children.count(children);

  // Scroll to bottom when new messages are added (childCount increases)
  useEffect(() => {
    const prevCount = prevChildCountRef.current;
    prevChildCountRef.current = childCount;

    // Only scroll if:
    // 1. Child count increased (new message)
    // 2. User is not actively scrolling
    // 3. User was near the bottom OR this is the first load
    if (childCount > prevCount && !isUserScrollingRef.current) {
      const wasNearBottom = isNearBottom();
      const isFirstLoad = prevCount === 0;

      if (wasNearBottom || isFirstLoad) {
        // Check if there's no textarea (not in edit mode)
        if (
          containerRef.current &&
          !containerRef.current.querySelector("textarea")
        ) {
          // Use instant scroll for first load, smooth for new messages
          scrollToBottom(isFirstLoad ? "instant" : "smooth");
        }
      }
    }
  }, [childCount, isNearBottom, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-4 pb-24 md:pb-20 ${className}`}
    >
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
}
