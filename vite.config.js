import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

// Add this to get __dirname support in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Updated to modern object syntax for aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/entry.js'),
      name: 'Vue3DoxygenXml',
      formats: ['es', 'umd'], // Build both ES and UMD
      fileName: (format) =>
        `vue3-doxygen-xml.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      // Externalize your peer dependencies (Vue, Vue Router, Pinia)
      // Axios is a dependency, so it stays bundled.
      external: ['vue', 'vue-router', 'pinia'],
      output: {
        // Provide global variable names for the UMD build
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia',
        },
      },
    },
  },
})
