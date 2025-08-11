import { Providers } from "../../src/providers";
import App from "../../src/app";

export default function Index() {
  return (
    // Providers is a default export in src/providers/* index; adjust if needed
    // We mount your existing React tree directly
    <Providers>
      <App />
    </Providers>
  );
}
