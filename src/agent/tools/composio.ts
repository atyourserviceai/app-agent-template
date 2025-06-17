/**
 * Composio tools integration
 *
 * This file only exports the raw toolset.
 * All wrapping for error handling is done in registry.ts.
 */

import { VercelAIToolSet } from "composio-core";

// Export Gmail tools as a function that can be called when needed
export const getGmailTools = async () => {
  // Initialize toolset only when needed
  const toolset = new VercelAIToolSet();
  return await toolset.getTools({ apps: ["gmail"] });
};
