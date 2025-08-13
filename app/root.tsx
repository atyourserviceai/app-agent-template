import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "../src/styles.css";

export const meta = () => [{ title: "App Agent Template" }];
export const links = () => [];

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
