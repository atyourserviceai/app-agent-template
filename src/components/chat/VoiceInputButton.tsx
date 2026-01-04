import { Microphone, Stop, CircleNotch, Warning } from "@phosphor-icons/react";
import { useCallback } from "react";
import { Button } from "@/components/button/Button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { VoiceInputState } from "@/types/voice";

interface VoiceInputButtonProps {
  /** Callback when transcription is successful */
  onTranscription: (text: string) => void;
  /** JWT token for API authentication */
  jwtToken?: string;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Button component for voice input (click-to-record)
 */
export function VoiceInputButton({
  onTranscription,
  jwtToken,
  disabled = false,
  className = ""
}: VoiceInputButtonProps) {
  const {
    state,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    error
  } = useVoiceInput({
    onTranscription,
    onError: (err) => console.error("Voice input error:", err),
    jwtToken
  });

  const handleClick = useCallback(() => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
    // If processing, do nothing - wait for it to complete
  }, [state, startRecording, stopRecording]);

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (state === "recording") {
        cancelRecording();
      }
    },
    [state, cancelRecording]
  );

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  const isDisabled = disabled || state === "processing";

  const getButtonStyles = (): string => {
    const baseStyles = "rounded-full h-10 w-10 flex-shrink-0 transition-all";

    if (state === "recording") {
      return `${baseStyles} bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 animate-pulse`;
    }

    if (state === "processing") {
      return `${baseStyles} bg-neutral-400 dark:bg-neutral-600 cursor-wait`;
    }

    if (error) {
      return `${baseStyles} bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700`;
    }

    return baseStyles;
  };

  const getIcon = () => {
    if (state === "processing") {
      return <CircleNotch size={16} className="animate-spin" />;
    }

    if (state === "recording") {
      return <Stop size={16} weight="fill" />;
    }

    if (error) {
      return <Warning size={16} />;
    }

    return <Microphone size={16} />;
  };

  const getAriaLabel = (): string => {
    if (state === "processing") {
      return "Processing audio...";
    }

    if (state === "recording") {
      return "Stop recording (right-click to cancel)";
    }

    if (error) {
      return `Voice input error: ${error}. Click to try again.`;
    }

    return "Start voice input";
  };

  const getTitle = (): string => {
    if (state === "processing") {
      return "Transcribing...";
    }

    if (state === "recording") {
      return "Click to stop, right-click to cancel";
    }

    if (error) {
      return error;
    }

    return "Click to record";
  };

  return (
    <Button
      type="button"
      shape="square"
      onClick={handleClick}
      onContextMenu={handleRightClick}
      disabled={isDisabled}
      className={`${getButtonStyles()} ${className}`}
      aria-label={getAriaLabel()}
      title={getTitle()}
    >
      {getIcon()}
    </Button>
  );
}

/**
 * Get a readable label for the voice input state
 */
export function getVoiceStateLabel(state: VoiceInputState): string {
  switch (state) {
    case "idle":
      return "Ready";
    case "recording":
      return "Recording...";
    case "processing":
      return "Transcribing...";
    default:
      return "";
  }
}
