import type { RouteConfig } from "@react-router/dev/routes";

const routes: RouteConfig = [
  { path: "/", file: "routes/_index.tsx" },
  { path: "/health", file: "routes/health.tsx" },
  { path: "/auth/callback", file: "routes/auth.callback.tsx" }
];

export default routes;
