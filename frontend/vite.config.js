import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on the local network too, so "npm run dev" shows a Network address
    // that phones and other computers on the same Wi-Fi can open
    host: true,
    // The app calls /api on its own address; Vite passes those requests to Django.
    // This works from any device, because the browser never needs Django's address.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
