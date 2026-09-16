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
    // The three.js + postprocessing graph is chunky by nature; split it into
    // separate chunks so the (tiny) app shell can paint instantly. Vite 8 runs
    // on Rolldown, which only accepts the function form of `manualChunks`.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('postprocessing') || id.includes('@react-three')) return 'r3f'
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
