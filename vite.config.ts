import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // onnxruntime-web trae su propio loader de wasm; dejar que Vite lo pre-bundle
  // rompe la resolución de los .wasm. Lo excluimos y servimos el wasm desde /ort.
  optimizeDeps: { exclude: ['onnxruntime-web'] },
})
