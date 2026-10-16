import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages(project site)에서는 /<repo>/ 하위 경로로 서비스되므로 base를 맞춘다.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/a260828ani_e/' : '/',
})
