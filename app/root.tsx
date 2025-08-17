import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "../src/styles.css";

export const meta = () => [
  { title: "App Agent Template" },
  {
    name: "viewport",
    content: "width=device-width, initial-scale=1.0",
  },
  {
    name: "description",
    content: "AI-powered chat agent built with Cloudflare Agents",
  },
  { property: "og:title", content: "App Agent Template" },
  {
    property: "og:description",
    content: "AI-powered chat agent built with Cloudflare Agents",
  },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: "App Agent Template" },
  { property: "og:image", content: "/api/og-image" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "App Agent Template" },
  {
    name: "twitter:description",
    content: "AI-powered chat agent built with Cloudflare Agents",
  },
  { name: "twitter:image", content: "/api/og-image" },
];
export const links = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        {/* Set theme class before hydration to avoid FOUC/mismatch */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=t? t==='dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);var de=document.documentElement;de.classList.toggle('dark',d);de.classList.toggle('light',!d);}catch(e){}})();",
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
