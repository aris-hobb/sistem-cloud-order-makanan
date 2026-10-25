import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
  ],
  server: {
    // Saat dev lokal, teruskan /api ke backend di port 3000
    proxy: { '/api': 'http://localhost:3000' },
  },
})
