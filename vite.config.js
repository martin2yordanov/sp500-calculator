import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Lets `npm run dev` hit the same /api/sxr8 contract that Vercel serves in production.
      '/api': 'http://localhost:3000',
    },
  },
})
