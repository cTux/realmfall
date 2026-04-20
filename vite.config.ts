import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import minipic from 'vite-plugin-minipic';
import { VitePWA } from 'vite-plugin-pwa';
import detectDuplicatedDeps from 'unplugin-detect-duplicated-deps/vite';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin, ViteDevServer } from 'vite';
import selfsigned from 'selfsigned';

const packageVersion = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
).version as string;

const DEV_CONTENT_SECURITY_POLICY =
  "default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'";

const RESPONSE_CONTENT_SECURITY_POLICY =
  "default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'";

function createSecurityHeaders(contentSecurityPolicy: string) {
  return {
    'Content-Security-Policy': contentSecurityPolicy,
    'Permissions-Policy':
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  } as const;
}

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

  if (
    normalizedId.includes('/src/app/audioSettings.ts') ||
    normalizedId.includes('/src/app/settingsStorage.ts')
  ) {
    return 'audio-ui';
  }

  if (!normalizedId.includes('/node_modules/')) {
    return undefined;
  }

  if (normalizedId.includes('/node_modules/@rexa-developer/tiks/')) {
    return 'audio-ui';
  }

  if (
    normalizedId.includes('/node_modules/react-use-audio-player/') ||
    normalizedId.includes('/node_modules/howler/')
  ) {
    return 'background-audio';
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

function vitestCachePlugin(): Plugin {
  const defaults = {
    dir: '.tests/vitest-cache',
    states: ['pass'],
    silent: false,
  } as const;

  return {
    name: 'realmfall-vitest-cache',
    config: () => ({
      test: {
        // Vitest 4 still supports runner/globalSetup, while the package's
        // default export currently routes to its Vitest 3 custom pool path.
        vCache: defaults,
        runner: fileURLToPath(
          new URL('./scripts/vitest-cache/runner.mjs', import.meta.url),
        ),
        globalSetup: fileURLToPath(
          new URL('./scripts/vitest-cache/setup.mjs', import.meta.url),
        ),
      },
    }),
  };
}
async function ensureLocalhostHttpsCertificate() {
  const certDir = join(tmpdir(), 'realmfall-https');
  const certPath = join(certDir, 'localhost-cert.pem');
  const keyPath = join(certDir, 'localhost-key.pem');

  const shouldRotateCertificate = (() => {
    if (!existsSync(certPath) || !existsSync(keyPath)) {
      return true;
    }

    try {
      const certificate = new X509Certificate(readFileSync(certPath));
      return Date.parse(certificate.validTo) <= Date.now();
    } catch {
      return true;
    }
  })();

  if (shouldRotateCertificate) {
    const { cert, private: privateKey } = await selfsigned.generate(
      [{ name: 'commonName', value: 'localhost' }],
      {
        algorithm: 'sha256',
        keySize: 2048,
        extensions: [
          {
            name: 'subjectAltName',
            altNames: [
              { type: 2, value: 'localhost' },
              { type: 7, ip: '127.0.0.1' },
              { type: 7, ip: '::1' },
            ],
          },
        ],
      },
    );

    mkdirSync(certDir, { recursive: true });
    writeFileSync(certPath, cert);
    writeFileSync(keyPath, privateKey);
  }

  return {
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  };
}

const localhostHttpsCertificate = await ensureLocalhostHttpsCertificate();
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
  },
  server: {
    headers: createSecurityHeaders(DEV_CONTENT_SECURITY_POLICY),
    https: {
      cert: localhostHttpsCertificate.cert,
      key: localhostHttpsCertificate.key,
    },
  },
  preview: {
    headers: createSecurityHeaders(RESPONSE_CONTENT_SECURITY_POLICY),
  },
  plugins: (() => {
    const isVitestRun = Boolean(process.env.VITEST);
    const isStorybookScript =
      process.env.npm_lifecycle_event?.includes('storybook') ?? false;

    return [
      isVitestRun && vitestCachePlugin(),
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
        manualChunks(id: string) {
          return getVendorChunk(id);
        },
        assetFileNames: (assetInfo: { names: string[]; name?: string }) => {
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
