import puppeteer from "@cloudflare/puppeteer";
import { getCurrentAgent } from "agents";
import { tool } from "ai";
import { z } from "zod";
import type { AppAgent } from "../AppAgent";

/**
 * Tool for browsing a web page and extracting content using Browserbase
 * This tool uses Puppeteer with Browserbase to fetch and extract content from a web page.
 */
export const browseWithBrowserbase = tool({
  description:
    "Browse a web page using Browserbase and extract its content. Useful for research, getting information from websites, and collecting data.",
  execute: async ({ url, selector = "body" }) => {
    try {
      // Get the agent context through getCurrentAgent
      const context = getCurrentAgent<AppAgent>();
      const agent = context.agent;

      if (!agent) {
        throw new Error("No agent found in current context");
      }

      // Use the secure method to access the API key
      const apiKey = agent.getBrowserbaseApiKey();

      console.log(
        "[browseWithBrowserbase] Checking Browserbase API key availability:",
        apiKey ? "Available" : "Not available"
      );

      if (!apiKey) {
        return "Cannot browse web page: Browserbase API key not configured. Please add your API key to the environment variables.";
      }

      // Use Browserbase to browse the page
      const result = await browsePage(url, selector, apiKey);

      return result;
    } catch (error) {
      console.error("Error in browseWithBrowserbase tool:", error);
      return `Failed to browse web page: ${error}`;
    }
  },
  parameters: z.object({
    selector: z
      .string()
      .optional()
      .describe(
        "Optional CSS selector to extract specific content from (defaults to 'body')"
      ),
    url: z.string().describe("URL to browse (e.g. 'https://example.com')")
  })
});

/**
 * Browse a web page using Browserbase and Puppeteer
 */
export async function browsePage(
  url: string,
  selector = "body",
  apiKey?: string
) {
  if (!apiKey) {
    throw new Error(
      "BROWSERBASE_API_KEY is not set. Please set this environment variable."
    );
  }

  console.log(
    `[Browserbase] Connecting to "${url}" with selector "${selector}"`
  );

  try {
    // Connect to Browserbase using the API key
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://connect.browserbase.com?apiKey=${apiKey}`
    });

    // Get the first page or create a new one
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Navigate to the URL with a timeout
    await page.goto(url, { timeout: 30000, waitUntil: "networkidle0" });
    console.log(
      `[Browserbase] Navigated to ${url}, current URL: ${page.url()}`
    );

    // Take a screenshot for debugging
    const screenshot = await page.screenshot({ encoding: "base64" });

    // Try to find the specific selector, fall back to body if not found
    let content = "";
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      content = await page.$eval(
        selector,
        (el) => el.textContent || el.innerHTML
      );
    } catch (_e) {
      console.log(
        `[Browserbase] Selector '${selector}' not found, extracting full page content.`
      );
      content = await page.$eval(
        "body",
        (el) => el.textContent || el.innerHTML
      );
    }

    const title = await page.title();
    const currentUrl = page.url(); // This may differ from the initial URL if redirects happened

    // Always close the browser to free resources
    await browser.close();

    return {
      content,
      screenshot: `data:image/png;base64,${screenshot}`,
      title,
      url: currentUrl
    };
  } catch (error) {
    console.error(`[Browserbase] Error browsing ${url}:`, error);
    throw error;
  }
}

/**
 * Function to extract text content from a web page using Browserbase
 * This can be called directly from server code
 */
export async function fetchWebPageContentWithBrowserbase(
  url: string,
  selector = "body",
  apiKey?: string
): Promise<Response> {
  try {
    if (!apiKey) {
      throw new Error("BROWSERBASE_API_KEY environment variable is not set");
    }

    const result = await browsePage(url, selector, apiKey);
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error(
      `Error fetching content from ${url} with Browserbase:`,
      error
    );
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
}
