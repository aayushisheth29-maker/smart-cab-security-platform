import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all interfaces so dev previews (ngrok, Arena, tunnels) work —
    // production on Vercel is unaffected by this dev-server-only setting.
    host: true,
    // Allow any host so preview hosts (e.g. 5173-<sandbox>.e2b.app) work.
    allowedHosts: true,
  },
})
