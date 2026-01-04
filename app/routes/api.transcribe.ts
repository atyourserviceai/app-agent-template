import type { ActionFunctionArgs } from "react-router";
import { experimental_transcribe as transcribe } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { validateAuthHeader } from "../lib/jwt-auth";

// Inline types to avoid path alias issues in server-side routes
interface TranscribeRequest {
  audio: string;
  mimeType: string;
}

interface TranscriptionResult {
  text: string;
  language?: string;
  durationInSeconds?: number;
}

interface TranscribeResponse {
  success: boolean;
  result?: TranscriptionResult;
  error?: string;
}

/**
 * API endpoint for audio transcription using OpenAI Whisper
 * Accepts base64-encoded audio and returns transcribed text
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  // Validate JWT authentication
  const authValidation = validateAuthHeader(request);
  if (!authValidation.isValid) {
    return Response.json(
      { success: false, error: authValidation.error } as TranscribeResponse,
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as TranscribeRequest;
    const { audio, mimeType } = body;

    if (!audio) {
      return Response.json(
        { success: false, error: "Missing audio data" } as TranscribeResponse,
        { status: 400 }
      );
    }

    if (!mimeType) {
      return Response.json(
        { success: false, error: "Missing mimeType" } as TranscribeResponse,
        { status: 400 }
      );
    }

    // Get environment variables
    const env = context.cloudflare.env as Env;
    const gatewayBaseUrl = env.GATEWAY_BASE_URL;

    if (!gatewayBaseUrl) {
      console.error("GATEWAY_BASE_URL not configured");
      return Response.json(
        {
          success: false,
          error: "Server configuration error"
        } as TranscribeResponse,
        { status: 500 }
      );
    }

    // Get the JWT token from the Authorization header to use as API key for gateway
    const authHeader = request.headers.get("Authorization");
    const jwtToken = authHeader?.substring(7); // Remove "Bearer " prefix

    if (!jwtToken) {
      return Response.json(
        {
          success: false,
          error: "Missing authentication token"
        } as TranscribeResponse,
        { status: 401 }
      );
    }

    // Create OpenAI client pointing to the gateway
    const openai = createOpenAI({
      apiKey: jwtToken,
      baseURL: `${gatewayBaseUrl}/v1/openai`
    });

    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Transcribe using AI SDK
    // Note: The audio parameter accepts Buffer/Uint8Array directly
    const result = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: audioBuffer
    });

    return Response.json({
      success: true,
      result: {
        text: result.text,
        language: result.language,
        durationInSeconds: result.durationInSeconds
      }
    } as TranscribeResponse);
  } catch (error) {
    console.error("Transcription error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        success: false,
        error: `Transcription failed: ${errorMessage}`
      } as TranscribeResponse,
      { status: 500 }
    );
  }
}
