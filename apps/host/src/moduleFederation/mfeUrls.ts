// Single source of truth for remote MFE entry URLs across environments.
//
// dev      -> load cross-origin from each remote's own Vite dev server (CORS).
// deployed -> load SAME-ORIGIN under /<remote>/*, which the host Worker proxies
//             to the matching remote Worker (see ../../worker/index.ts). No CORS,
//             and the URL is stable regardless of the remote Worker's hostname.

// Builds a dev entry URL from an optional .env override + a localhost fallback.
const devRemoteEntry = (envOverride: string | undefined, fallback: string) => {
  const origin = (envOverride ?? fallback).replace(/\/$/, '')
  return `${origin}/remoteEntry.js`
}

// `import.meta.env.DEV` is inlined as a literal at build time (true under
// `vite dev`, false under `vite build`), so the dev branches — and everything
// they reference (the VITE_*_URL lookups + localhost fallbacks) — are dropped
// from the deployed bundle. Production always resolves to the same-origin
// /<remote>/remoteEntry.js paths.
export const mfeUrls: Record<string, string> = {
  remoteA: import.meta.env.DEV
    ? devRemoteEntry(import.meta.env.VITE_REMOTE_A_URL, 'http://localhost:5174')
    : '/remote-a/remoteEntry.js',
  remoteB: import.meta.env.DEV
    ? devRemoteEntry(import.meta.env.VITE_REMOTE_B_URL, 'http://localhost:5175')
    : '/remote-b/remoteEntry.js',
}
