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
  build: {
    rollupOptions: {
      output: {
        /**
         * Three dependencies dominate the bundle and none of them changes when
         * the app does. Splitting them keeps a redeploy from invalidating a
         * megabyte of cached vendor code, and lets the browser fetch them in
         * parallel instead of down one wire.
         *
         * The function form rather than the object one: `['react', 'react-dom']`
         * only tags those packages' entry modules, so `react-dom/client` and
         * everything it pulls in ended up wherever Rollup felt like — in
         * practice, inside the Clerk chunk.
         *
         * It costs the iOS build nothing: there every chunk is already on the
         * device before the app starts.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/@clerk/')) return 'clerk'
          // d3-* and victory-* are recharts' own dependency tree.
          if (/\/(recharts|d3-|victory-)/.test(id)) return 'charts'
          if (/\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          return 'vendor'
        },
      },
    },
    // clerk-js is ~950 kB minified on its own and there is no trimming it
    // from the outside. Warning about it on every build would only train us
    // to scroll past build warnings.
    chunkSizeWarningLimit: 1000,
  },
})
