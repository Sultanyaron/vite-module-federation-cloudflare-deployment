import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      dts: false,
      name: 'remoteA',
      // Emitted as dist/remoteEntry.js — the container entry the host loads.
      filename: 'remoteEntry.js',
      exposes: {
        './Widget': './src/Widget.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
  build: {
    // Module Federation emits top-level await; needs a modern target.
    target: 'esnext',
  },
  // In dev the host loads the remote cross-origin from this server, and in
  // preview the same applies — allow CORS in both. When deployed, the host
  // Worker proxies the remote same-origin so CORS is not needed there.
  server: {
    port: 5174,
    strictPort: true,
    cors: { origin: '*' },
  },
  preview: {
    port: 5174,
    strictPort: true,
    cors: { origin: '*' },
  },
})
