import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod/v3";
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
  execute: async ({ urls, selector = "body", takeScreenshot = false }) => {
    try {
      // Get the agent context through getCurrentAgent
      const { agent } = getCurrentAgent<AppAgent>();

      if (!agent) {
        throw new Error("No agent found in current context");
      }

      // Get API key and base URL
      const apiKey = await agent.getBrowserApiKey();
      const baseUrl = await agent.getBrowserApiBaseUrl();

      if (!apiKey || !baseUrl) {
        return "Browser API configuration is incomplete. Please check your environment variables.";
      }

      console.log(
        `[browseWebPage] Processing ${urls.length} URLs with selector "${selector}"`
      );
      console.log(
        `[browseWebPage] Using API Key: ${apiKey.length <= 4 ? "[REDACTED]" : `${apiKey.substring(0, 2)}...${apiKey.substring(-2)} (${apiKey.length} chars)`} and Base URL: ${baseUrl}`
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
          message: "Could not retrieve content from any of the provided URLs."
        };
      }

      return { results };
    } catch (error) {
      console.error("[browseWebPage] Error in browse tool:", error);
      return `Failed to browse web pages: ${error}`;
    }
  },
  inputSchema: z.object({
    selector: z
      .string()
      .describe(
        "CSS selector to extract specific content from (defaults to 'body')"
      ),
    takeScreenshot: z
      .boolean()
      .describe("Whether to take a screenshot of the page (defaults to false)"),
    urls: z
      .array(z.string())
      .describe("List of URLs to browse (e.g. ['https://example.com'])")
  })
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
      contentLength: contentResult.content?.length || 0,
      hasError: !!contentResult.error,
      success: contentResult.success
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
    let screenshotData: string | undefined;
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
      content: contentResult.content,
      screenshot: screenshotData,
      sessionId: contentResult.sessionId,
      source: "browser-api",
      url
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
      selector,
      url
    };

    const response = await fetch(`${baseUrl}/v1/browser/gettext`, {
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    console.log(`[browser] gettext API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[browser] Content extraction failed with status ${response.status}: ${errorText}`
      );
      return {
        error: `HTTP error ${response.status}: ${errorText}`,
        success: false
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
      content: content || "No content found on page",
      sessionId,
      success: true
    };
  } catch (error) {
    console.error("[browser] Error extracting content:", error);
    return {
      error: String(error),
      success: false
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
        content: simpleFetchData.content,
        source: "simple-fetch",
        url
      };
    }
  } catch (simpleFetchError) {
    console.error("[browseWebPage] Simple fetch failed:", simpleFetchError);
  }

  // Return error info if all methods fail
  return {
    content: `Failed to browse ${url}`,
    error: "Failed to retrieve content with all available methods",
    source: "error",
    url
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
      body: JSON.stringify({
        fullPage: true,
        sessionId
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    console.log(`[browser] Screenshot API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[browser] Screenshot failed with status ${response.status}: ${errorText}`
      );
      return {
        error: `HTTP error ${response.status}: ${errorText}`,
        success: false
      };
    }

    return await handleScreenshotResponse(response);
  } catch (error) {
    console.error("[browser] Error taking screenshot:", error);
    return {
      error: String(error),
      success: false
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
        screenshot: `data:image/${imgType};base64,${base64Image}`,
        success: true
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
        screenshot: `data:image/png;base64,${base64Image}`,
        success: true
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
          screenshot: data.screenshot,
          success: true
        };
      }
      console.warn(
        "[browser] JSON response did not contain screenshot data",
        data
      );
      return {
        error: "No screenshot data in JSON response",
        success: false
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
            screenshot: `data:image/png;base64,${base64Image}`,
            success: true
          };
        } catch (b64Error) {
          console.error(
            "[browser] Failed to convert binary data to base64:",
            b64Error
          );
        }
      }

      return {
        error: `Failed to parse response as JSON or binary: ${jsonError}`,
        success: false
      };
    }
  } catch (error) {
    console.error("[browser] Error processing screenshot response:", error);
    return {
      error: `Error processing response: ${error}`,
      success: false
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
          error: contentResult.error || "Failed to extract content"
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
      content: contentResult.content,
      screenshot,
      sessionId: contentResult.sessionId,
      url
    });
  } catch (error) {
    console.error(`[browser] Error fetching content from ${url}:`, error);
    return Response.json(
      {
        error: String(error)
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
      contentLength: contentResult.content?.length || 0,
      contentPreview: `${contentResult.content?.substring(0, 100)}...`,
      error: contentResult.error,
      sessionId: contentResult.sessionId,
      success: contentResult.success
    });

    if (!contentResult.success || !contentResult.sessionId) {
      console.error(
        "[browser-test] Failed to extract content:",
        contentResult.error
      );
      return {
        error: contentResult.error || "Failed to extract content",
        success: false
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
      error: screenshotResult.error,
      screenshotLength: screenshotResult.screenshot?.length || 0,
      success: screenshotResult.success
    });

    // Complete test results
    return {
      content: contentResult.success ? contentResult.content : null,
      contentError: contentResult.error,
      contentSuccess: contentResult.success,
      screenshotError: screenshotResult.error,
      screenshotSuccess: screenshotResult.success,
      sessionId: contentResult.sessionId,
      success: true,
      url: testUrl
    };
  } catch (error) {
    console.error("[browser-test] Test failed with exception:", error);
    return {
      error: String(error),
      success: false
    };
  }
}
