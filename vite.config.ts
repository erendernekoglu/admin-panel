import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 4173 },
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        // Vendor code changes far less often than the app, so it gets its own
        // long-cached chunk instead of being re-downloaded on every deploy.
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
