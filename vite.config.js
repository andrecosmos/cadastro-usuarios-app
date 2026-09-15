import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    ...(process.env.VERCEL ? {} : {
      proxy: {
        '/api': {
          target: 'http://localhost:5005',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    }),
  },
})
