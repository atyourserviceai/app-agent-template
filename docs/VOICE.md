# Voice Input Feature

This document describes the voice input (speech-to-text) feature in the app-agent-template.

## Overview

The voice input feature allows users to dictate messages instead of typing. It uses the browser's MediaRecorder API to capture audio and sends it to the `/api/transcribe` endpoint for transcription via OpenAI's Whisper model.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  VoiceInputBtn  │────▶│  useVoiceInput   │────▶│ /api/transcribe │
│  (UI Component) │     │  (React Hook)    │     │  (API Route)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  OpenAI Whisper │
                                                 │  (via Gateway)  │
                                                 └─────────────────┘
```

## Components

### UI Component

**File:** `src/components/chat/VoiceInputButton.tsx`

A microphone button that appears next to the send button in the chat input. Provides visual feedback during recording and processing states.

**States:**

- Idle: Gray microphone icon
- Recording: Red pulsing microphone, click to stop
- Processing: Spinning indicator while transcribing

**Usage:**

```tsx
<VoiceInputButton
  onTranscription={(text) => setInput(text)}
  jwtToken={jwtToken}
  disabled={isLoading}
/>
```

### React Hook

**File:** `src/hooks/useVoiceInput.ts`

Manages the recording lifecycle using the MediaRecorder API.

**Features:**

- Automatic MIME type detection (webm/opus, webm, mp4, ogg)
- Configurable max duration (default: 60s)
- Noise suppression and echo cancellation
- Base64 encoding for API transmission

**Interface:**

```typescript
interface UseVoiceInputReturn {
  state: "idle" | "recording" | "processing";
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  error: string | null;
}
```

### API Endpoint

**File:** `app/routes/api.transcribe.ts`

Server-side endpoint that receives audio and calls OpenAI's Whisper model.

**Request:**

```json
{
  "audio": "<base64-encoded-audio>",
  "mimeType": "audio/webm"
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "text": "Transcribed text here",
    "durationInSeconds": 3.5
  }
}
```

### Type Definitions

**File:** `src/types/voice.ts`

Contains TypeScript interfaces for voice-related types:

- `VoiceInputState`
- `VoiceStreamingState`
- `VoiceInputConfig`
- `VADConfig`
- `TranscribeRequest`
- `TranscribeResponse`

## Browser Support

The feature requires:

- `navigator.mediaDevices.getUserMedia()` - for microphone access
- `MediaRecorder` API - for audio recording
- `AudioContext` - for audio processing

Most modern browsers support these APIs. The component gracefully hides itself if not supported.

## Authentication

The transcription API requires JWT authentication. The token is passed via the `Authorization: Bearer <token>` header.

## Future: VAD Streaming Mode (Currently Disabled)

### Background

There is a partially implemented Voice Activity Detection (VAD) streaming mode that would allow hands-free voice input. The implementation uses `@ricky0123/vad-web` which runs the Silero VAD model in the browser via ONNX Runtime.

### Why It's Disabled

The VAD feature is temporarily disabled due to ONNX Runtime loading issues:

1. **ONNX Model Loading**: The vad-web library requires loading the Silero VAD model (`silero_vad_legacy.onnx`) and ONNX Runtime WASM files at runtime.

2. **CDN Loading Failures**: When configured to load from CDN (jsdelivr), various errors occur:
   - 404 errors for model files
   - ONNX runtime version mismatches (`t.getValue is not a function`)
   - Missing WASM module files (`ort-wasm-simd-threaded.mjs`)

3. **Bundler Compatibility**: The library's default loading mechanism doesn't work well with Vite's dev server, which transforms import paths.

### Files Related to VAD

- `src/hooks/useVoiceStreaming.ts` - VAD streaming hook (implemented but not activated)
- `src/components/chat/VoiceInputButton.tsx` - Has commented-out VAD activation code

### Re-enabling VAD

To re-enable VAD streaming, the following needs to be resolved:

1. **Option A: Fix CDN Loading**
   - Find compatible versions of onnxruntime-web that work with vad-web
   - Ensure all required WASM files are available at the CDN paths

2. **Option B: Bundle ONNX Files Locally**
   - Copy ONNX model and WASM files to `public/` directory
   - Configure vad-web to load from local paths
   - May require Vite config changes for WASM handling

3. **Option C: Use Different VAD Library**
   - Consider alternatives like Web Speech API's continuous recognition
   - Or server-side VAD with WebSocket streaming

Once fixed, uncomment the VAD code in `VoiceInputButton.tsx`:

```typescript
// In handleClick, change this:
if (dictationSupported) {
  setMode("dictation");
  startRecording();
}

// Back to:
if (vadSupported) {
  setMode("vad");
  startListening();
}
```

### VAD Feature Design

When working, VAD mode would:

- Automatically detect when user starts/stops speaking
- Transcribe each speech segment independently
- Allow continuous hands-free dictation
- Show "listening" state (blue) and "speaking" state (green)
- Display a processing badge while transcribing without interrupting listening

## Dependencies

```json
{
  "@ricky0123/vad-web": "^0.0.29" // For VAD (currently not used)
}
```

The transcription uses AI SDK's `experimental_transcribe` function with OpenAI's Whisper model.
