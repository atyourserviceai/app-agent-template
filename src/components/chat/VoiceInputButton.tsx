import { Microphone, Stop, CircleNotch, Warning, Waveform } from "@phosphor-icons/react";
import { useCallback, useState, useRef } from "react";
import { Button } from "@/components/button/Button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoiceStreaming } from "@/hooks/useVoiceStreaming";
import type { VoiceInputState, VoiceStreamingState } from "@/types/voice";

type VoiceMode = "push-to-talk" | "vad";

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
 * Button component for voice input with two modes:
 * - Click: Push-to-talk (click to start, click to stop)
 * - Long-press (500ms): Toggle VAD streaming mode
 */
export function VoiceInputButton({
  onTranscription,
  jwtToken,
  disabled = false,
  className = ""
}: VoiceInputButtonProps) {
  const [mode, setMode] = useState<VoiceMode>("push-to-talk");
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Push-to-talk hook
  const {
    state: pttState,
    isSupported: pttSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    error: pttError
  } = useVoiceInput({
    onTranscription,
    onError: (err) => console.error("Voice input error:", err),
    jwtToken
  });

  // VAD streaming hook
  const {
    state: vadState,
    isSupported: vadSupported,
    isActive: vadActive,
    startListening,
    stopListening,
    error: vadError
  } = useVoiceStreaming({
    onTranscription,
    onError: (err) => console.error("VAD error:", err),
    jwtToken
  });

  const isSupported = pttSupported || vadSupported;
  const currentState = mode === "push-to-talk" ? pttState : vadState;
  const currentError = mode === "push-to-talk" ? pttError : vadError;

  const handleMouseDown = useCallback(() => {
    isLongPressRef.current = false;

    // Start long-press timer for mode toggle
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;

      // Toggle mode
      if (mode === "push-to-talk") {
        // Switch to VAD mode and start listening
        if (vadSupported) {
          setMode("vad");
          startListening();
        }
      } else {
        // Switch back to push-to-talk and stop VAD
        stopListening();
        setMode("push-to-talk");
      }
    }, 500);
  }, [mode, vadSupported, startListening, stopListening]);

  const handleMouseUp = useCallback(() => {
    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If it was a long press, don't handle as click
    if (isLongPressRef.current) {
      return;
    }

    // Handle as regular click based on mode
    if (mode === "push-to-talk") {
      if (pttState === "idle") {
        startRecording();
      } else if (pttState === "recording") {
        stopRecording();
      }
    } else {
      // In VAD mode, toggle listening
      if (vadActive) {
        stopListening();
      } else {
        startListening();
      }
    }
  }, [mode, pttState, vadActive, startRecording, stopRecording, startListening, stopListening]);

  const handleMouseLeave = useCallback(() => {
    // Clear long-press timer if mouse leaves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (mode === "push-to-talk" && pttState === "recording") {
        cancelRecording();
      } else if (mode === "vad" && vadActive) {
        stopListening();
        setMode("push-to-talk");
      }
    },
    [mode, pttState, vadActive, cancelRecording, stopListening]
  );

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  const isProcessing = currentState === "processing";
  const isDisabled = disabled || isProcessing;

  const getButtonStyles = (): string => {
    const baseStyles = "rounded-full h-10 w-10 flex-shrink-0 transition-all";

    // VAD mode styles
    if (mode === "vad") {
      if (vadState === "speaking") {
        return `${baseStyles} bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 animate-pulse`;
      }
      if (vadActive) {
        return `${baseStyles} bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700`;
      }
    }

    // Push-to-talk styles
    if (pttState === "recording") {
      return `${baseStyles} bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 animate-pulse`;
    }

    if (isProcessing) {
      return `${baseStyles} bg-neutral-400 dark:bg-neutral-600 cursor-wait`;
    }

    if (currentError) {
      return `${baseStyles} bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700`;
    }

    return baseStyles;
  };

  const getIcon = () => {
    if (isProcessing) {
      return <CircleNotch size={16} className="animate-spin" />;
    }

    if (mode === "vad") {
      if (vadState === "speaking") {
        return <Waveform size={16} weight="fill" />;
      }
      if (vadActive) {
        return <Waveform size={16} />;
      }
    }

    if (pttState === "recording") {
      return <Stop size={16} weight="fill" />;
    }

    if (currentError) {
      return <Warning size={16} />;
    }

    return <Microphone size={16} />;
  };

  const getAriaLabel = (): string => {
    if (isProcessing) {
      return "Processing audio...";
    }

    if (mode === "vad") {
      if (vadActive) {
        return "VAD listening - click to pause, right-click to exit VAD mode";
      }
      return "VAD paused - click to resume";
    }

    if (pttState === "recording") {
      return "Stop recording (right-click to cancel)";
    }

    if (currentError) {
      return `Voice input error: ${currentError}. Click to try again.`;
    }

    return "Click to record, hold for VAD mode";
  };

  const getTitle = (): string => {
    if (isProcessing) {
      return "Transcribing...";
    }

    if (mode === "vad") {
      if (vadState === "speaking") {
        return "Speaking detected...";
      }
      if (vadActive) {
        return "VAD listening (right-click to exit)";
      }
      return "VAD paused (click to resume)";
    }

    if (pttState === "recording") {
      return "Click to stop, right-click to cancel";
    }

    if (currentError) {
      return currentError;
    }

    return "Click to record, hold 0.5s for VAD mode";
  };

  return (
    <Button
      type="button"
      shape="square"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onContextMenu={handleRightClick}
      disabled={isDisabled}
      className={`${getButtonStyles()} ${className}`}
      aria-label={getAriaLabel()}
      tooltip={getTitle()}
    >
      {getIcon()}
    </Button>
  );
}

/**
 * Get a readable label for the voice input state
 */
export function getVoiceStateLabel(state: VoiceInputState | VoiceStreamingState): string {
  switch (state) {
    case "idle":
      return "Ready";
    case "recording":
      return "Recording...";
    case "listening":
      return "Listening...";
    case "speaking":
      return "Speaking...";
    case "processing":
      return "Transcribing...";
    default:
      return "";
  }
}
