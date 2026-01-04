import type { RouteConfig } from "@react-router/dev/routes";

const routes: RouteConfig = [
  { path: "/", file: "routes/_index.tsx" },
  { path: "/health", file: "routes/health.tsx" },
  { path: "/auth/callback", file: "routes/auth.callback.tsx" },
  { path: "/api/store-user-info", file: "routes/api.store-user-info.ts" },
  { path: "/api/clear-jwt", file: "routes/api.clear-jwt.ts" },
  { path: "/api/get-projects", file: "routes/api.get-projects.ts" },
  { path: "/api/transcribe", file: "routes/api.transcribe.ts" }
];

export default routes;
