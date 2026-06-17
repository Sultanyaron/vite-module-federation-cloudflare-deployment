/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Set at build time from the VITE_APP_VERSION env var (see deploy:* scripts).
  // Undefined in local dev.
  readonly VITE_APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
