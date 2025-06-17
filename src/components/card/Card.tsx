import { cn } from "@/lib/utils";
import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLElement>;
  tabIndex?: number;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
};

export const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    { as, children, className, tabIndex, variant = "secondary", ...rest },
    ref
  ) => {
    const Component = as ?? "div";
    return (
      <Component
        className={cn(
          "w-full rounded-lg p-4",
          {
            "btn-primary": variant === "primary",
            "btn-secondary": variant === "secondary",
          },
          className
        )}
        ref={ref}
        tabIndex={tabIndex}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);
