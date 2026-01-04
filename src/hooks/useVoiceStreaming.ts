import { useState, useRef, useCallback, useEffect } from "react";
import type {
  VoiceStreamingState,
  VADConfig,
  TranscribeRequest,
  TranscribeResponse
} from "@/types/voice";

interface UseVoiceStreamingOptions extends VADConfig {
  /** Callback when transcription is successful */
  onTranscription?: (text: string) => void;
  /** Callback when speech starts */
  onSpeechStart?: () => void;
  /** Callback when speech ends */
  onSpeechEnd?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** JWT token for API authentication */
  jwtToken?: string;
}

interface UseVoiceStreamingReturn {
  /** Current state of voice streaming */
  state: VoiceStreamingState;
  /** Whether the browser supports voice streaming */
  isSupported: boolean;
  /** Whether VAD is currently active */
  isActive: boolean;
  /** Whether currently processing a transcription (can be true while still listening) */
  isProcessing: boolean;
  /** Start listening for speech */
  startListening: () => Promise<void>;
  /** Stop listening */
  stopListening: () => void;
  /** Error message if any */
  error: string | null;
}

/**
 * Convert Float32Array audio to WAV format Uint8Array
 */
function float32ToWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM format chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Convert Float32 to Int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Hook for VAD (Voice Activity Detection) streaming voice input
 */
export function useVoiceStreaming(
  options: UseVoiceStreamingOptions = {}
): UseVoiceStreamingReturn {
  const {
    positiveSpeechThreshold = 0.8,
    negativeSpeechThreshold = 0.5,
    minSpeechMs = 250,
    preSpeechPadMs = 300,
    redemptionMs = 300,
    onTranscription,
    onSpeechStart,
    onSpeechEnd,
    onError,
    jwtToken
  } = options;

  const [state, setState] = useState<VoiceStreamingState>("idle");
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vadRef = useRef<any>(null);
  const isInitializingRef = useRef(false);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    "mediaDevices" in navigator &&
    "AudioContext" in window;

  // Transcribe audio segment
  const transcribeAudio = useCallback(
    async (audioData: Float32Array) => {
      // Set processing flag without changing main state (stays "listening")
      setIsProcessing(true);

      try {
        // Convert Float32Array to WAV format
        const wavData = float32ToWav(audioData, 16000);
        const base64Audio = uint8ArrayToBase64(wavData);

        const requestBody: TranscribeRequest = {
          audio: base64Audio,
          mimeType: "audio/wav"
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
        const errorMessage =
          err instanceof Error ? err.message : "Transcription failed";
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [jwtToken, onTranscription, onError]
  );

  // Initialize VAD
  const initVAD = useCallback(async () => {
    if (isInitializingRef.current || vadRef.current) {
      return vadRef.current;
    }

    isInitializingRef.current = true;

    try {
      // Dynamically import VAD library
      const { MicVAD } = await import("@ricky0123/vad-web");

      const vad = await MicVAD.new({
        positiveSpeechThreshold,
        negativeSpeechThreshold,
        minSpeechMs,
        preSpeechPadMs,
        redemptionMs,
        // Use legacy model with CDN paths
        model: "legacy",
        baseAssetPath:
          "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist",
        ortConfig: (ort: typeof import("onnxruntime-web")) => {
          ort.env.wasm.wasmPaths =
            "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/";
        },
        onSpeechStart: () => {
          setState("speaking");
          if (onSpeechStart) {
            onSpeechStart();
          }
        },
        onSpeechEnd: (audio: Float32Array) => {
          if (onSpeechEnd) {
            onSpeechEnd();
          }
          // Send audio for transcription
          transcribeAudio(audio);
        }
      });

      vadRef.current = vad;
      return vad;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize VAD";
      console.error("VAD initialization error:", err);
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return null;
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    positiveSpeechThreshold,
    negativeSpeechThreshold,
    minSpeechMs,
    preSpeechPadMs,
    redemptionMs,
    onSpeechStart,
    onSpeechEnd,
    onError,
    transcribeAudio
  ]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = "Voice streaming is not supported in this browser";
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    if (isActive) {
      return;
    }

    setError(null);

    try {
      const vad = await initVAD();
      if (!vad) {
        return;
      }

      await vad.start();
      setIsActive(true);
      setState("listening");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start listening";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [isSupported, isActive, initVAD, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.pause();
    }
    setIsActive(false);
    setIsProcessing(false);
    setState("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vadRef.current) {
        vadRef.current.destroy();
        vadRef.current = null;
      }
    };
  }, []);

  return {
    state,
    isSupported,
    isActive,
    isProcessing,
    startListening,
    stopListening,
    error
  };
}
