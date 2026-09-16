import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * The Infinitum Node — build configuration.
 *
 * The scene is a single WebGL canvas with a handful of large, static
 * BufferGeometries, so the interesting build knobs are all about keeping the
 * shipped bundle lean and the runtime allocation-free.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    // The three.js + postprocessing graph is chunky by nature; keep it in a
    // separate chunk so the (tiny) app shell can paint instantly.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          post: ['postprocessing', '@react-three/postprocessing'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
