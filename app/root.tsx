import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

export const meta = () => [{ title: "App Agent Template" }];
export const links = () => [];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
