import { useState, useRef, useCallback } from "react";
import type {
  VoiceInputState,
  VoiceInputConfig,
  TranscribeRequest,
  TranscribeResponse
} from "@/types/voice";

interface UseVoiceInputOptions extends VoiceInputConfig {
  /** Callback when transcription is successful */
  onTranscription?: (text: string) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** JWT token for API authentication */
  jwtToken?: string;
}

interface UseVoiceInputReturn {
  /** Current state of voice input */
  state: VoiceInputState;
  /** Whether the browser supports voice input */
  isSupported: boolean;
  /** Start recording audio */
  startRecording: () => Promise<void>;
  /** Stop recording and transcribe */
  stopRecording: () => Promise<void>;
  /** Cancel recording without transcribing */
  cancelRecording: () => void;
  /** Error message if any */
  error: string | null;
}

/**
 * Get the best supported MIME type for audio recording
 */
function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback
  return "audio/webm";
}

/**
 * Convert a Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Hook for click-to-record voice input with transcription
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    maxDuration = 60000,
    sampleRate = 16000,
    noiseSuppression = true,
    echoCancellation = true,
    onTranscription,
    onError,
    jwtToken
  } = options;

  const [state, setState] = useState<VoiceInputState>("idle");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mimeTypeRef = useRef<string>("");
  const shouldTranscribeRef = useRef<boolean>(false);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    "mediaDevices" in navigator &&
    "MediaRecorder" in window;

  const cleanup = useCallback(() => {
    // Stop and clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Mark that we should not transcribe (cancelled)
    shouldTranscribeRef.current = false;

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop all tracks on the stream
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    // Clear chunks
    chunksRef.current = [];
  }, []);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      setState("processing");

      try {
        const base64Audio = await blobToBase64(audioBlob);

        const requestBody: TranscribeRequest = {
          audio: base64Audio,
          mimeType: mimeTypeRef.current
        };

        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };

        if (jwtToken) {
          headers.Authorization = `Bearer ${jwtToken}`;
        }

        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody)
        });

        const data: TranscribeResponse = await response.json();

        if (!data.success || !data.result) {
          throw new Error(data.error || "Transcription failed");
        }

        const transcribedText = data.result.text;

        if (transcribedText && onTranscription) {
          onTranscription(transcribedText);
        }

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Transcription failed";
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setState("idle");
      }
    },
    [jwtToken, onTranscription, onError]
  );

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = "Voice input is not supported in this browser";
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    if (state !== "idle") {
      return;
    }

    setError(null);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate,
          echoCancellation,
          noiseSuppression
        }
      });

      streamRef.current = stream;

      // Get supported MIME type
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Only transcribe if we have audio data and should transcribe (not cancelled)
        if (audioBlob.size > 0 && shouldTranscribeRef.current) {
          await transcribeAudio(audioBlob);
        }

        // Cleanup stream
        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) {
            track.stop();
          }
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        const errorMsg = "Recording error occurred";
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        cleanup();
        setState("idle");
      };

      // Start recording
      shouldTranscribeRef.current = true;
      mediaRecorder.start();
      setState("recording");

      // Set max duration timeout
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopRecording();
        }
      }, maxDuration);
    } catch (err) {
      let errorMsg = "Failed to start recording";

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMsg = "Microphone permission denied";
        } else if (err.name === "NotFoundError") {
          errorMsg = "No microphone found";
        } else {
          errorMsg = err.message;
        }
      }

      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      cleanup();
      setState("idle");
    }
  }, [
    isSupported,
    state,
    sampleRate,
    echoCancellation,
    noiseSuppression,
    maxDuration,
    onError,
    cleanup,
    transcribeAudio
  ]);

  const stopRecording = useCallback(async () => {
    if (state !== "recording" || !mediaRecorderRef.current) {
      return;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Stop recording - the onstop handler will handle transcription
    mediaRecorderRef.current.stop();
  }, [state]);

  const cancelRecording = useCallback(() => {
    cleanup();
    setState("idle");
    setError(null);
  }, [cleanup]);

  return {
    state,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    error
  };
}
