import React from "react";
import type { AppAgentState } from "../agent/AppAgent";
import { ShareAssetTemplate } from "./share-asset-template";

export interface ShareExportOptions {
  format: "social" | "document" | "mobile";
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
      format: "social",
      theme: "light",
      includeDebug: false
    }
  ): Promise<Uint8Array> {
    const dimensions = this.getFormatDimensions(options.format);
    return await this.createPNGContent(agentState, options, dimensions);
  }


  private getFormatDimensions(format: string) {
    const dimensions = {
      social: { width: 1200, height: 630 }, // Twitter/LinkedIn card
      document: { width: 1920, height: 1080 }, // Full document/presentation
      mobile: { width: 750, height: 1334 } // Mobile screenshot
    };
    return dimensions[format as keyof typeof dimensions] || dimensions.social;
  }

  private async createPNGContent(
    agentState: AppAgentState,
    options: ShareExportOptions,
    dimensions: { width: number; height: number }
  ): Promise<Uint8Array> {
    try {
      // Use workers-og ImageResponse designed for Cloudflare Workers
      const { ImageResponse } = await import("workers-og");

      const imageResponse = await this.generateImageResponse(
        agentState,
        options,
        dimensions,
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
      <ShareAssetTemplate
        agentState={agentState}
        options={options}
        dimensions={dimensions}
      />,
      {
        width: dimensions.width,
        height: dimensions.height
        // Use system fonts - @vercel/og has built-in font support
      }
    );
  }
}
