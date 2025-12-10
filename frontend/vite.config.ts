import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Config updated to trigger reload
export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron to load assets
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.keep': 'text',
      },
    },
  },
 
  server: {
    port: 3500,
    strictPort: true,
  }
})
