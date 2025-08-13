import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflare as cf } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [
    cf({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths({
      ignoreConfigErrors: true,
      projects: [path.resolve(__dirname, "tsconfig.json")],
    }),
  ],
  server: {
    port: 6001,
    strictPort: true,
  },
});
