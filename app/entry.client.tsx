import { HydratedRouter } from "react-router/dom";
import { hydrateRoot } from "react-dom/client";
import { startTransition, StrictMode } from "react";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
