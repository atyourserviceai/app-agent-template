/**
 * Worker entry point for deployment
 * Re-exports Durable Objects and provides the fetch handler
 */

// Re-export Durable Objects for Cloudflare Workers
export { AppAgent } from "../src/agent";
export { UserDO } from "../src/agent/UserDO";

// Import the main worker logic
import worker from "../src/worker";

// Re-export the default fetch handler
export default worker;
