import { defineConfig } from 'vite'

export default defineConfig({
  root: 'pwa',
  base: './',
  server: {
    port: 8735,
    open: false,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    rollupOptions: {
      input: 'pwa/index.html',
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) return 'css/[name].css'
          if (assetInfo.name.endsWith('.png') || assetInfo.name.endsWith('.jpg')) return 'img/[name][extname]'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
