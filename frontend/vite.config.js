import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_OWNER_MODE=true (set on the private smart-cab-owner-portal Vercel
// project) makes the same frontend build render ONLY the Owner Portal —
// no rider UI, no rider routes. The rider project leaves it unset.
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
