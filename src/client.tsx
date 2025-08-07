import "./styles.css";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Providers } from "@/providers";
import App from "./app";

const root = document.getElementById("root")!;

const AppComponent = (
  <Providers>
    <div className="bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
      <App />
    </div>
  </Providers>
);

// Check if the root has SSR content (more than just whitespace)
const hasSSRContent = root.children.length > 0 || root.textContent?.trim();

if (hasSSRContent) {
  // SSR content exists, use hydration
  hydrateRoot(root, AppComponent);
} else {
  // No SSR content, use normal rendering (Vite dev server)
  createRoot(root).render(AppComponent);
}
