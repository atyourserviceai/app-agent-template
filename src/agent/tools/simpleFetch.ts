import { tool } from "ai";
import { z } from 'zod/v3';

/**
 * Tool for fetching and extracting content from a web page using native fetch
 * This is a simpler alternative to browser-based scraping, with fewer capabilities
 * but less overhead and complexity
 */
export const fetchWebPage = tool({
  description:
    "Fetch a web page and extract its content using simple HTTP requests. Useful for basic research and information gathering.",
  execute: async ({ url, selector = "body" }) => {
    try {
      console.log(`[simpleFetch] Fetching ${url} with selector "${selector}"`);

      // Simple fetch request
      const response = await fetch(url, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
        }
      });

      if (!response.ok) {
        return `Failed to fetch ${url}: HTTP status ${response.status}`;
      }

      // Get the content type to determine how to process the response
      const contentType = response.headers.get("content-type") || "";

      // If it's not HTML, just return the text
      if (!contentType.includes("text/html")) {
        const text = await response.text();

        // For simplicity, truncate very large responses
        const truncatedText =
          text.length > 10000
            ? `${text.substring(0, 10000)}... [content truncated]`
            : text;

        return {
          content: truncatedText,
          contentType,
          url
        };
      }

      // For HTML content, extract the relevant parts
      const html = await response.text();

      // Use RegExp to extract the title since we don't have a full DOM implementation
      const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
      const title = titleMatch ? titleMatch[1] : "";

      // Basic text extraction - this is a simplified approach
      // For more complex scenarios, you might need a different approach
      const cleanText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const truncatedText =
        cleanText.length > 10000
          ? `${cleanText.substring(0, 10000)}... [content truncated]`
          : cleanText;

      return {
        content: truncatedText, // This may differ from input URL if redirects occurred
        contentType,
        title,
        url: response.url
      };
    } catch (error) {
      console.error(`[simpleFetch] Error fetching ${url}:`, error);
      return `Failed to fetch web page: ${error}`;
    }
  },
  inputSchema: z.object({
    selector: z
      .string()
      .optional()
      .describe(
        "Optional CSS selector to extract specific content (defaults to 'body')"
      ),
    url: z.string().url().describe("URL to fetch (e.g. 'https://example.com')")
  })
});

/**
 * Simple function to fetch web page content
 * Can be used server-side without the agent context
 */
export async function fetchPageContent(
  url: string,
  _selector = "body"
): Promise<Response> {
  try {
    console.log(`[simpleFetch] Direct fetching ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
      }
    });

    if (!response.ok) {
      return Response.json(
        {
          error: `Failed to fetch: HTTP status ${response.status}`
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    // Get the text content
    const text = await response.text();

    // For HTML content, extract title
    let title = "";
    if (contentType.includes("text/html")) {
      const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(text);
      title = titleMatch ? titleMatch[1] : "";
    }

    // Truncate content if needed
    const truncatedContent =
      text.length > 50000
        ? `${text.substring(0, 50000)}... [content truncated]`
        : text;

    return Response.json({
      content: truncatedContent,
      contentType,
      title,
      url: response.url
    });
  } catch (error) {
    console.error("[simpleFetch] Error in direct fetch:", error);
    return Response.json(
      {
        error: String(error)
      },
      { status: 500 }
    );
  }
}
