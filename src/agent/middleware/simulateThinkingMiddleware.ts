import type { LanguageModelV1 } from 'ai';

/**
 * Middleware to simulate an LLM that streams thinking tokens during processing
 * This creates a realistic simulation for testing thinking tokens UX
 */
export function simulateThinkingLLM(): LanguageModelV1 {
  const thinkingTokens = `Let me carefully analyze this user request and determine the most appropriate response...

First, I need to understand the context of their message. They said: "${process.env.LAST_USER_MESSAGE || 'debug test reasoning tokens'}"

This appears to be a test message to verify that thinking tokens are working properly. I should provide a meaningful response that demonstrates the thinking process while also being helpful.

Key considerations for my response:
1. The user seems to be testing the thinking tokens functionality
2. I should demonstrate a thorough reasoning process
3. The response should be relevant and helpful
4. I need to show that I'm processing their request thoughtfully

Let me think about what would be most valuable for them...

If this is indeed a test of thinking tokens, they probably want to see:
- A substantial thinking process (like what they're seeing now)
- Proper streaming of reasoning tokens with visible delays
- The amber thinking indicator in the UI
- A coherent final response

For the actual response, I should:
- Acknowledge that this appears to be a test
- Confirm that thinking tokens are working
- Provide some insight about the process
- Ask if there's anything specific they'd like to test

This demonstrates the kind of reasoning process that would typically happen when evaluating a user's startup idea or answering their questions.

I'm also considering whether they might want to continue with their actual assessment after this test, so I should offer to proceed with that if they're ready.

The thinking tokens feature is designed to give users insight into the AI's reasoning process, making the interaction more transparent and trustworthy. This is especially valuable for complex assessments like startup idea evaluation where users want to understand the methodology behind the recommendations.

Alright, proceeding with a helpful response that acknowledges the test while offering real value...`;

  const responseText = `Great! I can see you're testing the thinking tokens functionality. 

✅ **Thinking tokens are working!** You should have seen the amber thinking indicator while I was processing your request just now.

Here's what happened during that thinking phase:
- I analyzed your request and recognized it as a test
- I considered what would be most valuable to demonstrate
- I reasoned through the proper response approach
- I prepared this response explaining the process

**Key features being tested:**
- Reasoning token streaming with visible delays
- Amber UI indicator during thinking phase  
- Proper state management between thinking and response phases
- Integration between simulation middleware and existing UI

If you'd like to continue testing, try asking me something more complex about your startup idea evaluation, and you'll see an even more elaborate thinking process as I work through the assessment methodology.

Ready to proceed with your actual assessment, or would you like to test anything else about the thinking tokens feature?`;

  return {
    specificationVersion: "v1" as const,
    provider: "simulation" as const,
    modelId: "thinking-simulation" as const,
    defaultObjectGenerationMode: "json" as const,

    doGenerate: async () => {
      return {
        text: responseText,
        reasoning: thinkingTokens,
        finishReason: "stop" as const,
        usage: { promptTokens: 0, completionTokens: responseText.length },
        warnings: [],
        rawCall: { rawPrompt: null, rawSettings: {} },
        rawResponse: { headers: {} },
      };
    },

    doStream: async () => {
      // Use simulateStreamingMiddleware approach from AI SDK source
      const simulatedStream = new ReadableStream({
        async start(controller) {
          console.log("*".repeat(80));
          console.log("🎭🎭🎭 SIMULATION STREAM STARTING - THIS SHOULD SHOW IN LOGS 🎭🎭🎭");
          console.log("*".repeat(80));
          
          // First, stream the reasoning tokens in chunks for realistic effect
          console.log("🧠 Streaming reasoning tokens:", thinkingTokens.substring(0, 100));
          for (let i = 0; i < thinkingTokens.length; i += 60) {
            await new Promise((resolve) => setTimeout(resolve, 800)); // Much longer delay
            const chunk = thinkingTokens.slice(i, i + 60);
            
            console.log("🧠 REASONING CHUNK:", chunk.substring(0, 40) + "..."); // Log each chunk
            controller.enqueue({
              type: "reasoning",
              textDelta: chunk
            });
          }

          // Small pause between reasoning and response
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Then stream the text response in chunks
          console.log("📝 Streaming simulated response:", responseText.substring(0, 100));
          for (let i = 0; i < responseText.length; i += 25) {
            await new Promise((resolve) => setTimeout(resolve, 60));
            const chunk = responseText.slice(i, i + 25);
            
            console.log("📝 Streaming chunk:", chunk);
            controller.enqueue({
              type: "text-delta",
              textDelta: chunk
            });
          }

          // Finally, finish the stream
          console.log("✅ SIMULATION STREAM FINISHING");
          controller.enqueue({
            type: "finish",
            finishReason: "stop" as const,
            usage: { promptTokens: 0, completionTokens: responseText.length }
          });

          controller.close();
        }
      });

      return {
        stream: simulatedStream,
        rawCall: { rawPrompt: null, rawSettings: {} },
        rawResponse: { headers: {} },
        warnings: [],
      };
    },
  };
}
