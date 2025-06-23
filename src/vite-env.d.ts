/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OAUTH_PROVIDER_BASE_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
