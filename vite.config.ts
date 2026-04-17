import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import minipic from 'vite-plugin-minipic';
import { VitePWA } from 'vite-plugin-pwa';
import detectDuplicatedDeps from 'unplugin-detect-duplicated-deps/vite';
import { readFileSync } from 'node:fs';
import type { Plugin, ViteDevServer } from 'vite';

const packageVersion = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
).version as string;

function versionManifestPlugin(): Plugin {
  const versionManifest = JSON.stringify({ version: packageVersion }, null, 2);

  return {
    name: 'realmfall-version-manifest',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0];

        if (pathname !== '/version.json') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(versionManifest);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${versionManifest}\n`,
      });
    },
  };
}

function getVendorChunk(id: string) {
  const normalizedId = id.replace(/\\/g, '/');

  if (!normalizedId.includes('/node_modules/')) {
    return undefined;
  }

  if (
    normalizedId.includes('/node_modules/pixi.js/') ||
    normalizedId.includes('/node_modules/@pixi/')
  ) {
    return 'pixi';
  }

  if (
    normalizedId.includes('/node_modules/react/') ||
    normalizedId.includes('/node_modules/react/jsx-runtime') ||
    normalizedId.includes('/node_modules/react/jsx-dev-runtime')
  ) {
    return 'react-core';
  }

  if (
    normalizedId.includes('/node_modules/react-dom/') ||
    normalizedId.includes('/node_modules/scheduler/')
  ) {
    return 'react-dom-vendor';
  }

  return 'vendor';
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
  },
  plugins: (() => {
    const isStorybookScript =
      process.env.npm_lifecycle_event?.includes('storybook') ?? false;

    return [
      react(),
      versionManifestPlugin(),
      !isStorybookScript &&
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
          },
        }),
      detectDuplicatedDeps(),
      !isStorybookScript && minipic(),
    ].filter(Boolean);
  })(),
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        manualChunks(id) {
          return getVendorChunk(id);
        },
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
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
