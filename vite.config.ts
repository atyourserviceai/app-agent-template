import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ ssrBuild }) => ({
  plugins: [
    cloudflare({
      inspectorPort: 9329, // Set inspector port to avoid conflicts
      viteEnvironment: {
        name: "ssr", // Assign Worker to SSR environment per Cloudflare docs
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true, // Enable source maps for better error debugging
    // For the client build only, emit a stable entry filename we can reference from SSR HTML
    rollupOptions: ssrBuild
      ? undefined
      : {
          input: path.resolve(__dirname, "src/client.tsx"),
          output: {
            entryFileNames: "assets/client.js",
            chunkFileNames: "assets/[name].js",
            assetFileNames: (assetInfo) => {
              if (assetInfo.name && assetInfo.name.endsWith(".css")) {
                return "assets/index.css";
              }
              return "assets/[name][extname]";
            },
          },
        },
  },
  server: {
    port: 5273,
    strictPort: true,
  },
}));
