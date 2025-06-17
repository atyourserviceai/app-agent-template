import { ClipboardText } from "@phosphor-icons/react";
import { useState } from "react";

interface CopyButtonProps {
  messageText: string;
}

export function CopyButton({ messageText }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = messageText.replace(/^scheduled message: /, "");

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <button
      type="button"
      className={`p-1 rounded cursor-pointer flex items-center justify-center w-6 h-6 transition-colors duration-200 ${
        copied
          ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
          : "text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800"
      }`}
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy message"}
      title={copied ? "Copied!" : "Copy message"}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <title>Checkmark</title>
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <ClipboardText size={14} aria-hidden="true" />
      )}
    </button>
  );
}
