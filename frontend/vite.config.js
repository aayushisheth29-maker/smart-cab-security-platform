import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow any host so dev previews (ngrok, Arena, tunnels) work —
    // production on Vercel is unaffected by this dev-server-only setting.
    allowedHosts: true,
  },
})
