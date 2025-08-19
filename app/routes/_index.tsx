import { Providers } from "../../src/providers";
import App from "../../src/app";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ context }: LoaderFunctionArgs) {
  // Get the environment variable from the server context
  const env = context?.cloudflare?.env;
  return {
    environment: env?.SETTINGS_ENVIRONMENT || "production",
  };
}

export default function Index() {
  return (
    // Providers is a default export in src/providers/* index; adjust if needed
    // We mount your existing React tree directly
    <Providers>
      <App />
    </Providers>
  );
}
