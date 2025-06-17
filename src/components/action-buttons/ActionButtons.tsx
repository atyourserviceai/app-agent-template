import { Button } from "@/components/button/Button";

interface ActionButtonsProps {
  actions: {
    label: string;
    value: string;
    primary?: boolean;
    isOther?: boolean;
    id?: string;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
  }[];
  onActionClick: (value: string, isOther?: boolean) => void;
}

export function ActionButtons({ actions, onActionClick }: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {actions.map((action, index) => (
        <Button
          key={action.id || action.label || index}
          variant={action.primary ? "secondary" : "ghost"}
          className={`
            ${action.primary ? "font-bold" : ""}
            ${action.className || ""}
          `}
          size="sm"
          onClick={() => onActionClick(action.value, action.isOther)}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
