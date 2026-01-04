/**
 * Voice input types for speech-to-text functionality
 */

/** State of the voice input recording */
export type VoiceInputState = "idle" | "recording" | "processing";

/** State of VAD (Voice Activity Detection) streaming */
export type VoiceStreamingState =
  | "idle"
  | "listening"
  | "speaking"
  | "processing";

/** Configuration for voice input */
export interface VoiceInputConfig {
  /** Maximum recording duration in milliseconds (default: 60000 = 1 minute) */
  maxDuration?: number;
  /** Audio sample rate (default: 16000) */
  sampleRate?: number;
  /** Enable noise suppression (default: true) */
  noiseSuppression?: boolean;
  /** Enable echo cancellation (default: true) */
  echoCancellation?: boolean;
}

/** Result from transcription API */
export interface TranscriptionResult {
  /** Transcribed text */
  text: string;
  /** Detected language code (e.g., "en", "es") */
  language?: string;
  /** Duration of the audio in seconds */
  durationInSeconds?: number;
}

/** Request body for transcription API */
export interface TranscribeRequest {
  /** Base64-encoded audio data */
  audio: string;
  /** MIME type of the audio (e.g., "audio/webm;codecs=opus") */
  mimeType: string;
}

/** Response from transcription API */
export interface TranscribeResponse {
  success: boolean;
  result?: TranscriptionResult;
  error?: string;
}

/** VAD (Voice Activity Detection) configuration */
export interface VADConfig {
  /** Threshold for positive speech detection (0-1, default: 0.8) */
  positiveSpeechThreshold?: number;
  /** Threshold for negative speech detection (0-1, default: 0.5) */
  negativeSpeechThreshold?: number;
  /** Minimum speech duration in ms before triggering (default: 250) */
  minSpeechMs?: number;
  /** Pre-speech padding in ms (default: 300) */
  preSpeechPadMs?: number;
  /** Redemption time in ms before ending speech (default: 300) */
  redemptionMs?: number;
}
