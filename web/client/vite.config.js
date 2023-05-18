import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import vue2 from '@vitejs/plugin-vue2'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:8081',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }

    }
  },
  plugins: [
    vue2(),
    Components({
      resolvers: [
        // Vuetify
        VuetifyResolver(),
      ],
    }),
    legacy({
      targets: ['ie >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
