import React from "react";
import { renderToString } from "react-dom/server";
import { HelmetProvider, type FilledContext } from "react-helmet-async";
import { Providers } from "@/providers";
import App from "./app";

export function render() {
  const helmetContext: { helmet?: FilledContext["helmet"] } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <Providers>
        <App />
      </Providers>
    </HelmetProvider>
  );
  return { appHtml: html, helmet: helmetContext.helmet } as const;
}
