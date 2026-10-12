import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Unique id per build. Published as version.json so open tabs can detect a newer deploy.
const BUILD_ID = Date.now().toString(36)

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId: BUILD_ID }) })
      },
    },
  ],
  base: './',
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          react: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        },
      },
    },
  },
})
