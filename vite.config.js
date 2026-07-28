import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Caminho relativo: funciona em qualquer subpasta (ex: GitHub Pages de projeto)
  // sem precisar saber o nome do repositório de antemão.
  base: "./",
  plugins: [react(), tailwindcss()],
})
