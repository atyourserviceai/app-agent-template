import { RemixBrowser } from "react-router";
import { hydrateRoot } from "react-dom/client";
import { startTransition, StrictMode } from "react";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
