import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names[0] ?? assetInfo.name ?? '';
          const extension = name.split('.').pop()?.toLowerCase() ?? '';

          if (extension === 'css') {
            return 'assets/css/[name]-[hash][extname]';
          }

          if (
            ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(extension)
          ) {
            return 'assets/images/[name]-[hash][extname]';
          }

          if (extension === 'svg') {
            return 'assets/icons/[name]-[hash][extname]';
          }

          if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }

          return 'assets/misc/[name]-[hash][extname]';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
