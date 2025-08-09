import { ClipboardText, Robot } from "@phosphor-icons/react";

interface ChatTabsProps {
  activeTab: "chat" | "presentation";
  setActiveTab: (tab: "chat" | "presentation") => void;
}

/**
 * ChatTabs component - mobile navigation tabs positioned at the bottom
 */
export function ChatTabs({ activeTab, setActiveTab }: ChatTabsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 md:hidden">
      <div className="flex">
        <button
          type="button"
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${
            activeTab === "chat" ? "text-[#F48120]" : "text-neutral-500"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          <Robot size={20} aria-hidden="true" />
          <span className="text-xs font-medium">Chat</span>
        </button>
        <button
          type="button"
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${
            activeTab === "presentation" ? "text-[#F48120]" : "text-neutral-500"
          }`}
          onClick={() => setActiveTab("presentation")}
        >
          <ClipboardText size={20} aria-hidden="true" />
          <span className="text-xs font-medium">Playbook</span>
        </button>
      </div>
    </div>
  );
}
