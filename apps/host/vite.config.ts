import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import { federation } from '@module-federation/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cloudflare(),
    federation({
      dts: false,
      name: 'host',
      // Remotes are registered at RUNTIME (see src/moduleFederation/*),
      // so the entry URL can differ between dev and deployed environments.
      remotes: {},
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
      shareStrategy: 'loaded-first',
    }),
  ],
  build: {
    // Module Federation emits top-level await; needs a modern target.
    target: 'esnext',
  },
})
