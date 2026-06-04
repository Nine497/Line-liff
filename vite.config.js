import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^moment$/,
        replacement: fileURLToPath(new URL('./node_modules/moment/moment.js', import.meta.url)),
      },
    ],
  },
  optimizeDeps: {
    include: ['calendarjs', 'moment'],
  },
})
