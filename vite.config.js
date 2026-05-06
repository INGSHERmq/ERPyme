import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/groq/, ''),
          headers: env.GROQ_API_KEY
            ? { Authorization: `Bearer ${env.GROQ_API_KEY}` }
            : {}
        }
      }
    }
  }
})
