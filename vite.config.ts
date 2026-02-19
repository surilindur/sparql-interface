import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
    assetsInclude: [
    '**/*.ejs'
  ],
  base: process.env.APPLICATION_ROOT_PATH ?? '/',
  plugins: [ vue() ]
})
