import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'motion': ['framer-motion'],
          'audio': ['howler'],
        }
      }
    },
    chunkSizeWarningLimit: 1500, // Increase limit for vocabulary JSON
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'howler']
  }
})
