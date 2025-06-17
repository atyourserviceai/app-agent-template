import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod";
import type { AppAgent } from "../AppAgent";
import { fetchPageContent } from "./simpleFetch"; // Import simple fetch for fallback

// Interfaces for the browser API
interface BrowserSession {
  sessionId: string;
  createdAt: string;
  lastUsed: string;
  status: string;
}

interface BrowserResponse {
  success: boolean;
  error?: string;
  sessionId?: string;
  content?: string;
  screenshot?: string;
  pdf?: string;
  sessions?: BrowserSession[];
}

// Add an interface for the simpleFetch API response
interface SimpleFetchResponse {
  url: string;
  title?: string;
  contentType?: string;
  content: string;
  error?: string;
}

// Result structure for page browsing
interface BrowseResult {
  url: string;
  content: string;
  source: string;
  error?: string;
  screenshot?: string;
  sessionId?: string;
}

/**
 * Browser tool that utilizes an external browser API service
 * This tool allows browsing websites, taking screenshots, and extracting content
 */
export const browseWebPage = tool({
  description:
    "Browse a web page and extract its content. Useful for research, getting information from websites, and collecting data. Provide one or more URLs.",
  parameters: z.object({
    urls: z
      .array(z.string().url())
      .describe("List of URLs to browse (e.g. ['https://example.com'])"),
    selector: z
      .string()
      .optional()
      .describe(
        "Optional CSS selector to extract specific content from (defaults to 'body')"
      ),
    takeScreenshot: z
      .boolean()
      .optional()
      .describe("Whether to take a screenshot of the page (defaults to false)"),
  }),
  execute: async ({ urls, selector = "body", takeScreenshot = false }) => {
    try {
      // Get the agent context through getCurrentAgent
      const { agent } = getCurrentAgent<AppAgent>();

      if (!agent) {
        throw new Error("No agent found in current context");
      }

      // Get API key and base URL
      const apiKey = agent.getBrowserApiKey();
      const baseUrl = agent.getBrowserApiBaseUrl();

      if (!apiKey || !baseUrl) {
        return "Browser API configuration is incomplete. Please check your environment variables.";
      }

      console.log(
        `[browseWebPage] Processing ${urls.length} URLs with selector "${selector}"`
      );
      console.log(
        `[browseWebPage] Using API Key (first 5 chars): ${apiKey.substring(0, 5)}... and Base URL: ${baseUrl}`
      );

      const results: BrowseResult[] = [];

      for (const url of urls) {
        try {
          console.log(`[browseWebPage] Browsing ${url}...`);
          const result = await processUrl(
            url,
            selector,
            takeScreenshot,
            apiKey,
            baseUrl
          );
          results.push(result);
          console.log(
            `[browseWebPage] Successfully processed ${url}, content length: ${result.content.length} chars`
          );
        } catch (error) {
          console.error(`[browseWebPage] Error browsing ${url}:`, error);
          // Fall back to simple fetch if we encounter an error
          const fallbackResult = await getFallbackContent(url, selector);
          results.push(fallbackResult);
        }
      }

      if (results.length === 0) {
        return {
          message: "Could not retrieve content from any of the provided URLs.",
        };
      }

      return { results };
    } catch (error) {
      console.error("[browseWebPage] Error in browse tool:", error);
      return `Failed to browse web pages: ${error}`;
    }
  },
});

/**
 * Process a single URL using browser API with fallback to simple fetch
 */
async function processUrl(
  url: string,
  selector: string,
  takeScreenshot: boolean,
  apiKey: string,
  baseUrl: string
): Promise<BrowseResult> {
  try {
    console.log(
      `[browseWebPage] Processing ${url} with selector "${selector}"`
    );

    // Extract content directly - no need for separate session creation
    const contentResult = await extractContent(url, selector, apiKey, baseUrl);

    console.log(`[browseWebPage] Content extraction result for ${url}:`, {
      success: contentResult.success,
      contentLength: contentResult.content?.length || 0,
      hasError: !!contentResult.error,
    });

    // Check if we got content from the browser API
    if (
      !contentResult.success ||
      !contentResult.content ||
      contentResult.content === "No content found on page"
    ) {
      // Fall back to simple fetch if browser content extraction fails
      return await getFallbackContent(url, selector);
    }

    // Take a screenshot if requested
    let screenshotData: string | undefined = undefined;
    if (takeScreenshot && contentResult.sessionId) {
      const screenshotResult = await takePageScreenshot(
        contentResult.sessionId,
        apiKey,
        baseUrl
      );
      if (screenshotResult.success && screenshotResult.screenshot) {
        screenshotData = screenshotResult.screenshot;
        console.log(
          `[browseWebPage] Screenshot captured for ${url}, size: ${screenshotData.length} chars`
        );
      } else {
        console.warn(
          `[browseWebPage] Failed to capture screenshot for ${url}: ${screenshotResult.error}`
        );
      }
    }

    // Compile the results
    return {
      url,
      content: contentResult.content,
      source: "browser-api",
      screenshot: screenshotData,
      sessionId: contentResult.sessionId,
    };
  } catch (error) {
    console.error(`[browseWebPage] Error processing ${url}:`, error);
    return await getFallbackContent(url, selector);
  }
}

/**
 * Extracts content from the specified URL directly
 */
async function extractContent(
  url: string,
  selector: string,
  apiKey: string,
  baseUrl: string
): Promise<BrowserResponse> {
  try {
    console.log(
      `[browser] Extracting content from URL "${url}" with selector "${selector}"`
    );

    const requestBody = {
      url,
      selector,
    };

    const response = await fetch(`${baseUrl}/v1/browser/gettext`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[browser] gettext API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[browser] Content extraction failed with status ${response.status}: ${errorText}`
      );
      return {
        success: false,
        error: `HTTP error ${response.status}: ${errorText}`,
      };
    }

    const responseData = await response.json();
    console.log("[browser] Content API response parsed successfully.");

    // Define interfaces for the response data
    interface BrowserContentResponse {
      content?: string;
      text?: string;
      sessionId?: string;
    }

    // Check for content in the expected field with appropriate typing
    const data = responseData as BrowserContentResponse;
    const content = data.content || data.text || "";
    // Get session ID for possible screenshot use
    const sessionId = data.sessionId;

    console.log(
      `[browser] Successfully extracted content, length: ${content.length} characters`
    );
    if (content.length > 0) {
      console.log(
        `[browser] Content begins with: ${content.substring(0, 100)}...`
      );
    } else {
      console.warn(
        "[browser] Content is empty despite successful API response"
      );
    }

    return {
      success: true,
      content: content || "No content found on page",
      sessionId,
    };
  } catch (error) {
    console.error("[browser] Error extracting content:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Get content using the simple fetch fallback mechanism
 */
async function getFallbackContent(
  url: string,
  selector: string
): Promise<BrowseResult> {
  console.log(`[browseWebPage] Using simple fetch fallback for ${url}`);
  try {
    const simpleFetchResponse = await fetchPageContent(url, selector);
    const simpleFetchData =
      (await simpleFetchResponse.json()) as SimpleFetchResponse;

    if (simpleFetchData.content) {
      console.log(
        `[browseWebPage] Simple fetch successful for ${url}, content length: ${simpleFetchData.content.length}`
      );
      return {
        url,
        content: simpleFetchData.content,
        source: "simple-fetch",
      };
    }
  } catch (simpleFetchError) {
    console.error("[browseWebPage] Simple fetch failed:", simpleFetchError);
  }

  // Return error info if all methods fail
  return {
    url,
    error: "Failed to retrieve content with all available methods",
    content: `Failed to browse ${url}`,
    source: "error",
  };
}

/**
 * Takes a screenshot of the current page
 */
async function takePageScreenshot(
  sessionId: string,
  apiKey: string,
  baseUrl: string
): Promise<BrowserResponse> {
  try {
    console.log(`[browser] Taking screenshot for session ${sessionId}`);
    const response = await fetch(`${baseUrl}/v1/browser/screenshot`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        fullPage: true,
      }),
    });

    console.log(`[browser] Screenshot API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[browser] Screenshot failed with status ${response.status}: ${errorText}`
      );
      return {
        success: false,
        error: `HTTP error ${response.status}: ${errorText}`,
      };
    }

    return await handleScreenshotResponse(response);
  } catch (error) {
    console.error("[browser] Error taking screenshot:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Helper function to handle screenshot response which can be binary or JSON
 */
async function handleScreenshotResponse(
  response: Response
): Promise<BrowserResponse> {
  try {
    // Check the content type to determine how to handle the response
    const contentType = response.headers.get("content-type");
    console.log(
      `[browser] Screenshot response content type: ${contentType || "not specified"}`
    );

    // For image content types, directly handle as binary
    if (contentType?.includes("image")) {
      console.log(
        "[browser] Content-Type indicates image data, processing as binary"
      );
      const arrayBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString("base64");
      const imgType = contentType.split("/")[1] || "png";

      return {
        success: true,
        screenshot: `data:image/${imgType};base64,${base64Image}`,
      };
    }

    // Not a binary image, try to parse as JSON
    const text = await response.text();

    // Last check: if text starts with PNG signature as text representation
    if (text.startsWith("\x89PNG")) {
      console.log(
        "[browser] Response is binary PNG data incorrectly treated as text"
      );
      const base64Image = Buffer.from(text, "binary").toString("base64");

      return {
        success: true,
        screenshot: `data:image/png;base64,${base64Image}`,
      };
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log(
        "[browser] Successfully parsed response as JSON. Keys:",
        Object.keys(data)
      );

      if (data.screenshot) {
        return {
          success: true,
          screenshot: data.screenshot,
        };
      }
      console.warn(
        "[browser] JSON response did not contain screenshot data",
        data
      );
      return {
        success: false,
        error: "No screenshot data in JSON response",
      };
    } catch (jsonError) {
      console.error("[browser] Failed to parse as JSON:", jsonError);

      // If we get here and content looks like binary data, try one more time to treat as binary
      if (
        text.length > 0 &&
        (text.charCodeAt(0) === 0x89 || text.includes("PNG"))
      ) {
        console.log(
          "[browser] Response appears to be binary data, attempting base64 conversion"
        );
        try {
          const base64Image = Buffer.from(text, "binary").toString("base64");
          return {
            success: true,
            screenshot: `data:image/png;base64,${base64Image}`,
          };
        } catch (b64Error) {
          console.error(
            "[browser] Failed to convert binary data to base64:",
            b64Error
          );
        }
      }

      return {
        success: false,
        error: `Failed to parse response as JSON or binary: ${jsonError}`,
      };
    }
  } catch (error) {
    console.error("[browser] Error processing screenshot response:", error);
    return {
      success: false,
      error: `Error processing response: ${error}`,
    };
  }
}

/**
 * Helper function to handle web page content extraction via the browser API
 * For use with direct HTTP endpoints
 */
export async function fetchWebPageContent(
  url: string,
  apiKey: string,
  baseUrl: string,
  selector = "body"
): Promise<Response> {
  try {
    // Extract content directly
    const contentResult = await extractContent(url, selector, apiKey, baseUrl);

    if (!contentResult.success) {
      return Response.json(
        {
          error: contentResult.error || "Failed to extract content",
        },
        { status: 500 }
      );
    }

    // Take a screenshot for visual reference if we have a session ID
    let screenshot = null;
    if (contentResult.sessionId) {
      const screenshotResult = await takePageScreenshot(
        contentResult.sessionId,
        apiKey,
        baseUrl
      );
      if (screenshotResult.success && screenshotResult.screenshot) {
        screenshot = screenshotResult.screenshot;
      }
    }

    return Response.json({
      url,
      content: contentResult.content,
      screenshot,
      sessionId: contentResult.sessionId,
    });
  } catch (error) {
    console.error(`[browser] Error fetching content from ${url}:`, error);
    return Response.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Test function for the browser API
 * Can be called directly to verify functionality
 */
export async function testBrowserTool(apiKey: string, baseUrl: string) {
  console.log("[browser-test] Starting browser API test");

  try {
    // Test URL
    const testUrl = "https://example.com";
    console.log(`[browser-test] Testing with URL ${testUrl}`);

    // Extract content directly
    console.log("[browser-test] Extracting content from page");
    const contentResult = await extractContent(
      testUrl,
      "body",
      apiKey,
      baseUrl
    );
    console.log("[browser-test] Content extraction result:", {
      success: contentResult.success,
      contentLength: contentResult.content?.length || 0,
      contentPreview: `${contentResult.content?.substring(0, 100)}...`,
      sessionId: contentResult.sessionId,
      error: contentResult.error,
    });

    if (!contentResult.success || !contentResult.sessionId) {
      console.error(
        "[browser-test] Failed to extract content:",
        contentResult.error
      );
      return {
        success: false,
        error: contentResult.error || "Failed to extract content",
      };
    }

    // Take a screenshot
    console.log("[browser-test] Taking screenshot");
    const screenshotResult = await takePageScreenshot(
      contentResult.sessionId,
      apiKey,
      baseUrl
    );
    console.log("[browser-test] Screenshot result:", {
      success: screenshotResult.success,
      screenshotLength: screenshotResult.screenshot?.length || 0,
      error: screenshotResult.error,
    });

    // Complete test results
    return {
      success: true,
      url: testUrl,
      sessionId: contentResult.sessionId,
      content: contentResult.success ? contentResult.content : null,
      contentSuccess: contentResult.success,
      contentError: contentResult.error,
      screenshotSuccess: screenshotResult.success,
      screenshotError: screenshotResult.error,
    };
  } catch (error) {
    console.error("[browser-test] Test failed with exception:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
