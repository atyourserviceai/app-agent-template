import type { RemixConfig } from "@remix-run/dev";

export default {
  serverBuildTarget: "cloudflare",
  serverModuleFormat: "esm",
  publicPath: "/build/",
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
  },
} satisfies RemixConfig;
