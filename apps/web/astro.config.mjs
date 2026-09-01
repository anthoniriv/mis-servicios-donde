import { defineConfig } from 'astro/config';

const apiTarget = 'http://127.0.0.1:3000';

export default defineConfig({
  output: 'static',
  vite: {
    server: {
      proxy: {
        '/v1': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    ssr: {
      noExternal: ['cookie'],
    },
  },
});