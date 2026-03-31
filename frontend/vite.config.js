import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './', // Spune-i că index.html e aici
  base: './', // Repară erorile 404 de cale
  build: {
    outDir: 'dist',
  }
})