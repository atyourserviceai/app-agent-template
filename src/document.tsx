import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

type DocumentProps = {
  appHtml: string;
  title?: string;
};

export function renderDocument({
  appHtml,
  title = "AI Chat Agent",
}: DocumentProps): string {
  const html = (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta
          name="description"
          content="AI-powered chat agent built with Cloudflare Agents"
        />
        <meta name="theme-color" content="#000000" />
        <title>{title}</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.toggle(
  "dark",
  localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
);`,
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link rel="stylesheet" crossOrigin="" href="/assets/index.css" />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root" dangerouslySetInnerHTML={{ __html: appHtml }} />
        <script type="module" src="/assets/client.js" />
      </body>
    </html>
  );

  return `<!DOCTYPE html>${renderToStaticMarkup(html)}`;
}
