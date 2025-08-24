import { X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

type ModalProps = {
  className?: string;
  children: React.ReactNode;
  clickOutsideToClose?: boolean;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg";
};

export const Modal = ({
  className,
  children,
  clickOutsideToClose = false,
  isOpen,
  onClose,
  title,
  size = "md",
}: ModalProps) => {
  const modalRef = clickOutsideToClose
    ? // biome-ignore lint/correctness/useHookAtTopLevel: todo
      useClickOutside(onClose)
    : // biome-ignore lint/correctness/useHookAtTopLevel: todo
      useRef<HTMLDivElement>(null);

  // Stop site overflow when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Tab focus
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab moves focus backward
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab moves focus forward
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, modalRef.current]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 z-50 flex h-screen w-full items-center justify-center p-6">
      <div className="fade fixed top-0 left-0 h-full w-full bg-black/5 backdrop-blur-[2px]" />

      <Card
        className={cn(
          "reveal reveal-sm relative z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700",
          {
            "max-w-sm": size === "sm",
            "max-w-md": size === "md",
            "max-w-lg": size === "lg",
          },
          className
        )}
        ref={modalRef}
        tabIndex={-1}
        variant="secondary"
      >
        {title && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
          </div>
        )}

        <div className={title ? "" : "pt-6"}>{children}</div>

        <Button
          aria-label="Close Modal"
          shape="square"
          className="absolute top-2 right-2"
          onClick={onClose}
          variant="ghost"
        >
          <X size={16} />
        </Button>
      </Card>
    </div>
  );
};
