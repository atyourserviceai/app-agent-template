import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflare as cf } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [
    cf({
      viteEnvironment: { name: "server" },
      inspectorPort: 9329 // Set inspector port to avoid conflicts
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths({
      ignoreConfigErrors: true,
      projects: [path.resolve(__dirname, "tsconfig.json")]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5273,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ["workers-og"],
    // Pre-bundle common dependencies to prevent runtime discovery conflicts
    include: [
      "react",
      "react-dom",
      "react-dom/server",
      "clsx",
      "tailwind-merge",
      "@phosphor-icons/react"
    ]
  },
  environments: {
    server: {
      optimizeDeps: {
        // Pre-bundle all server dependencies to prevent runtime discovery
        // which causes version conflicts. Add new deps here if you see
        // "optimized dependencies changed" errors during dev.
        include: [
          "react",
          "react-dom",
          "react-dom/server",
          "react-router",
          "@cloudflare/ai-chat",
          "@cloudflare/ai-chat/react",
          "@ai-sdk/anthropic",
          "@ai-sdk/openai",
          "@ai-sdk/react",
          "ai",
          "agents/react",
          "@phosphor-icons/react",
          "clsx",
          "tailwind-merge",
          "class-variance-authority",
          "@radix-ui/react-dropdown-menu",
          "@ricky0123/vad-web",
          "marked",
          "react-markdown",
          "remark-gfm",
          "pixi.js"
        ]
      }
    }
  },
  assetsInclude: ["**/*.woff2", "**/*.wasm"],
  build: {
    outDir: "build"
  }
});
