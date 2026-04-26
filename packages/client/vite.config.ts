import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { getAppBuildVersion } from './scripts/build-version.helpers';
import { getViteBasePath } from '../../scripts/git-deploy.helpers.mjs';
import {
  CHUNK_SIZE_WARNING_LIMIT_KB,
  getAssetFileName,
  getManualChunk,
  resolveModulePreloadDependencies,
} from './vite/chunks';
import { ensureLocalhostHttpsCertificate } from './vite/https';
import { createVitePlugins } from './vite/plugins';
import { VITEST_PROJECTS } from './vite/testProjects';
import {
  createSecurityHeaders,
  DEV_CONTENT_SECURITY_POLICY,
  RESPONSE_CONTENT_SECURITY_POLICY,
} from './vite.security';

const RUN_DUPLICATE_DEPS_AUDIT =
  process.env.REALMFALL_DUPLICATE_DEPS_AUDIT === '1';
const RUN_BUNDLE_VISUALIZER = process.env.REALMFALL_BUNDLE_VISUALIZER === '1';

const packageVersion = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).version as string;
const appBuildVersion = getAppBuildVersion(packageVersion);
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

const localhostHttpsCertificate = await ensureLocalhostHttpsCertificate();
export default defineConfig({
  base: getViteBasePath(),
  root: repoRoot,
  define: {
    __APP_VERSION__: JSON.stringify(appBuildVersion),
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

    return createVitePlugins({
      appBuildVersion,
      isStorybookScript,
      isVitestRun,
      runBundleVisualizer: RUN_BUNDLE_VISUALIZER,
      runDuplicateDepsAudit: RUN_DUPLICATE_DEPS_AUDIT,
    });
  })(),
  build: {
    outDir: resolve(repoRoot, 'dist'),
    manifest: true,
    chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT_KB,
    modulePreload: {
      resolveDependencies: (_filename, deps, context) =>
        resolveModulePreloadDependencies(_filename, deps, context),
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        manualChunks(id: string) {
          return getManualChunk(id);
        },
        assetFileNames: getAssetFileName,
      },
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
    },
    projects: VITEST_PROJECTS,
  },
});
