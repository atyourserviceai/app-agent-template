import "./styles.css";
import { Providers } from "@/providers";
import { createRoot } from "react-dom/client";
import App from "./app";

const root = createRoot(document.getElementById("app")!);

root.render(
  <Providers>
    <div className="bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
      <App />
    </div>
  </Providers>
);
