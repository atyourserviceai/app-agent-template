import React from "react";
import { renderToString } from "react-dom/server";
import { Providers } from "@/providers";
import App from "./app";

export function render() {
  const html = renderToString(
    <Providers>
      <App />
    </Providers>
  );
  return html;
}
