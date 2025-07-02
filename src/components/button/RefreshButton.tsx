import { ArrowsClockwise } from "@phosphor-icons/react";
import type { ButtonProps } from "@/components/button/Button";
import { Button } from "@/components/button/Button";
import { cn } from "@/lib/utils";

export const RefreshButton = ({ ...props }: ButtonProps) => (
  <Button shape="square" toggled={props.toggled} {...props}>
    <ArrowsClockwise
      className={cn({
        "animate-refresh": props.toggled,
        "size-4": props.size === "sm",
        "size-4.5": props.size === "base",
        "size-5": props.size === "lg",
      })}
    />
  </Button>
);
