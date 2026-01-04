import {
  Microphone,
  Stop,
  CircleNotch,
  Warning,
  Waveform
} from "@phosphor-icons/react";
import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/button/Button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoiceStreaming } from "@/hooks/useVoiceStreaming";
import type { VoiceInputState, VoiceStreamingState } from "@/types/voice";

type VoiceMode = "idle" | "dictation" | "vad";

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

const DOUBLE_CLICK_THRESHOLD = 300; // ms

/**
 * Button component for voice input with two modes:
 * - Single click: Dictation (click to start, click to stop, then transcribe)
 * - Double click: VAD streaming (auto-detect speech, keeps listening until stopped)
 */
export function VoiceInputButton({
  onTranscription,
  jwtToken,
  disabled = false,
  className = ""
}: VoiceInputButtonProps) {
  const [mode, setMode] = useState<VoiceMode>("idle");
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dictation (click-to-record) hook
  const {
    state: dictationState,
    isSupported: dictationSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    error: dictationError
  } = useVoiceInput({
    onTranscription: (text) => {
      onTranscription(text);
      setMode("idle");
    },
    onError: (err) => {
      console.error("Dictation error:", err);
      setMode("idle");
    },
    jwtToken
  });

  // VAD streaming hook
  const {
    state: vadState,
    isSupported: vadSupported,
    isActive: vadActive,
    isProcessing: vadProcessing,
    stopListening,
    error: vadError
  } = useVoiceStreaming({
    onTranscription,
    onError: (err) => console.error("VAD error:", err),
    jwtToken
  });

  const isSupported = dictationSupported || vadSupported;

  // Clear click timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    // If we're in an active mode, handle stopping
    if (mode === "dictation") {
      if (dictationState === "recording") {
        stopRecording();
      }
      return;
    }

    if (mode === "vad") {
      stopListening();
      setMode("idle");
      return;
    }

    // We're idle - track clicks for single/double click detection
    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
      // First click - wait to see if there's a second
      clickTimerRef.current = setTimeout(() => {
        // Single click - start dictation mode
        clickCountRef.current = 0;
        if (dictationSupported) {
          setMode("dictation");
          startRecording();
        }
      }, DOUBLE_CLICK_THRESHOLD);
    } else if (clickCountRef.current === 2) {
      // Double click - VAD mode (temporarily disabled due to ONNX runtime issues)
      // TODO: Re-enable when vad-web ONNX loading is fixed
      // See docs/VOICE.md for details
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      clickCountRef.current = 0;

      // VAD temporarily disabled - just start dictation instead
      if (dictationSupported) {
        setMode("dictation");
        startRecording();
      }
      // Original VAD code:
      // if (vadSupported) {
      //   setMode("vad");
      //   startListening();
      // }
    }
  }, [
    mode,
    dictationState,
    dictationSupported,
    startRecording,
    stopRecording,
    stopListening
  ]);

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (mode === "dictation" && dictationState === "recording") {
        cancelRecording();
        setMode("idle");
      } else if (mode === "vad") {
        stopListening();
        setMode("idle");
      }
    },
    [mode, dictationState, cancelRecording, stopListening]
  );

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  const isDictationProcessing = dictationState === "processing";
  const isDisabled = disabled || isDictationProcessing;

  const getButtonStyles = (): string => {
    const baseStyles =
      "relative rounded-full h-10 w-10 flex-shrink-0 transition-all";

    // VAD mode styles
    if (mode === "vad") {
      if (vadState === "speaking") {
        return `${baseStyles} bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 animate-pulse`;
      }
      if (vadActive) {
        return `${baseStyles} bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700`;
      }
    }

    // Dictation mode styles
    if (mode === "dictation") {
      if (dictationState === "recording") {
        return `${baseStyles} bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 animate-pulse`;
      }
      if (isDictationProcessing) {
        return `${baseStyles} bg-neutral-400 dark:bg-neutral-600 cursor-wait`;
      }
    }

    // Error styles
    const currentError = mode === "dictation" ? dictationError : vadError;
    if (currentError) {
      return `${baseStyles} bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700`;
    }

    return baseStyles;
  };

  const getIcon = () => {
    // Dictation processing - show spinner as main icon
    if (isDictationProcessing) {
      return <CircleNotch size={16} className="animate-spin" />;
    }

    // VAD mode icons
    if (mode === "vad") {
      if (vadState === "speaking") {
        return <Waveform size={16} weight="fill" />;
      }
      if (vadActive) {
        return <Waveform size={16} />;
      }
    }

    // Dictation recording - show stop icon
    if (mode === "dictation" && dictationState === "recording") {
      return <Stop size={16} weight="fill" />;
    }

    // Error state
    const currentError = mode === "dictation" ? dictationError : vadError;
    if (currentError) {
      return <Warning size={16} />;
    }

    // Default - microphone
    return <Microphone size={16} />;
  };

  const getAriaLabel = (): string => {
    if (isDictationProcessing) {
      return "Transcribing audio...";
    }

    if (mode === "vad") {
      if (vadActive) {
        return "VAD listening - click to stop";
      }
      return "VAD mode";
    }

    if (mode === "dictation") {
      if (dictationState === "recording") {
        return "Recording - click to stop, right-click to cancel";
      }
    }

    const currentError = mode === "dictation" ? dictationError : vadError;
    if (currentError) {
      return `Voice input error: ${currentError}. Click to try again.`;
    }

    return "Click to start dictation";
  };

  const getTitle = (): string => {
    if (isDictationProcessing) {
      return "Transcribing...";
    }

    if (mode === "vad") {
      if (vadState === "speaking") {
        return "Speaking detected...";
      }
      if (vadActive) {
        return vadProcessing
          ? "Listening (transcribing...)"
          : "Listening - click to stop";
      }
    }

    if (mode === "dictation") {
      if (dictationState === "recording") {
        return "Click to stop, right-click to cancel";
      }
    }

    const currentError = mode === "dictation" ? dictationError : vadError;
    if (currentError) {
      return currentError;
    }

    return "Click to dictate";
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
      tooltip={getTitle()}
    >
      {getIcon()}
      {/* Processing badge for VAD mode - shows while still listening */}
      {mode === "vad" && vadProcessing && vadActive && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-neutral-800 shadow-sm">
          <CircleNotch size={10} className="animate-spin text-blue-500" />
        </span>
      )}
    </Button>
  );
}

/**
 * Get a readable label for the voice input state
 */
export function getVoiceStateLabel(
  state: VoiceInputState | VoiceStreamingState
): string {
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
