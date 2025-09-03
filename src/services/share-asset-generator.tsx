import React from "react";
import type { AppAgentState } from "../agent/AppAgent";
import { ShareAssetTemplate } from "./share-asset-template";

export interface ShareExportOptions {
  format: "square" | "mobile";
  theme: "light" | "dark";
  includeDebug: boolean;
}

export interface ShareResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Share Asset Generator Service
 * Creates shareable PNG images from agent state
 */
export class ShareAssetGenerator {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async generatePNGExport(
    agentState: AppAgentState,
    options: ShareExportOptions = {
      format: "square",
      theme: "light",
      includeDebug: false
    }
  ): Promise<Uint8Array> {
    const dimensions = this.getFormatDimensions(options.format);
    return await this.createPNGContent(agentState, options, dimensions);
  }

  private getFormatDimensions(format: string) {
    const dimensions = {
      square: { width: 1080, height: 1080 }, // Square format for Instagram, LinkedIn, etc.
      mobile: { width: 750, height: null } // Mobile width, height will be dynamic
    };
    return (
      dimensions[format as keyof typeof dimensions] || dimensions["square"]
    );
  }

  private async createPNGContent(
    agentState: AppAgentState,
    options: ShareExportOptions,
    dimensions: { width: number; height: number | null }
  ): Promise<Uint8Array> {
    try {
      // Use workers-og ImageResponse designed for Cloudflare Workers
      // Handle WASM "Already initialized" error that occurs in development with hot reloads
      let ImageResponse;
      try {
        const workersOg = await import("workers-og");
        ImageResponse = workersOg.ImageResponse;
      } catch (wasmError) {
        // Known issue: workers-og WASM gets re-initialized on hot reloads in development
        // The ImageResponse class is still available even after the "Already initialized" error
        if (
          wasmError instanceof Error &&
          wasmError.message.includes("Already initialized")
        ) {
          console.warn(
            "workers-og WASM already initialized (common in development hot reloads)"
          );
          // Import should still work to get the ImageResponse class despite the WASM error
          const workersOg = await import("workers-og");
          ImageResponse = workersOg.ImageResponse;
        } else {
          throw wasmError;
        }
      }

      // For mobile format, calculate dynamic height based on content
      let finalDimensions = dimensions;
      if (options.format === "mobile" && dimensions.height === null) {
        // Estimate height based on content - this is a rough calculation
        // In practice, the ImageResponse will auto-size to content
        finalDimensions = { width: dimensions.width, height: 1600 }; // Default mobile height
      }

      const imageResponse = await this.generateImageResponse(
        agentState,
        options,
        finalDimensions as { width: number; height: number },
        ImageResponse
      );
      const arrayBuffer = await imageResponse.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error("PNG generation failed:", error);
      throw new Error(
        `PNG generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private async generateImageResponse(
    agentState: AppAgentState,
    options: ShareExportOptions,
    dimensions: { width: number; height: number },
    ImageResponse: any
  ): Promise<Response> {
    return new ImageResponse(
      (
        <ShareAssetTemplate
          agentState={agentState}
          options={options}
          dimensions={dimensions}
        />
      ),
      {
        width: dimensions.width,
        height: dimensions.height
        // Use system fonts - @vercel/og has built-in font support
      }
    );
  }
}
