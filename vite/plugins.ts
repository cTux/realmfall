import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import minipic from 'vite-plugin-minipic';
import detectDuplicatedDeps from 'unplugin-detect-duplicated-deps/vite';
import type { Plugin, PluginOption, ViteDevServer } from 'vite';

const BUNDLE_VISUALIZER_OUTPUT = join('.tests', 'bundle', 'visualizer.html');

export function createVersionManifestPlugin(appBuildVersion: string): Plugin {
  const versionManifest = JSON.stringify({ version: appBuildVersion }, null, 2);

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

export function vitestCachePlugin(): Plugin {
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
          new URL('../scripts/vitest-cache/runner.mjs', import.meta.url),
        ),
        globalSetup: fileURLToPath(
          new URL('../scripts/vitest-cache/setup.mjs', import.meta.url),
        ),
      },
    }),
  };
}

interface CreateVitePluginsOptions {
  appBuildVersion: string;
  isStorybookScript: boolean;
  isVitestRun: boolean;
  runBundleVisualizer: boolean;
  runDuplicateDepsAudit: boolean;
}

export function createVitePlugins({
  appBuildVersion,
  isStorybookScript,
  isVitestRun,
  runBundleVisualizer,
  runDuplicateDepsAudit,
}: CreateVitePluginsOptions): PluginOption[] {
  return [
    isVitestRun && vitestCachePlugin(),
    react(),
    createVersionManifestPlugin(appBuildVersion),
    runDuplicateDepsAudit && detectDuplicatedDeps(),
    !isStorybookScript && minipic(),
    runBundleVisualizer &&
      (visualizer({
        brotliSize: true,
        filename: BUNDLE_VISUALIZER_OUTPUT,
        gzipSize: true,
        open: true,
        projectRoot: process.cwd(),
        template: 'treemap',
      }) as PluginOption),
  ].filter(Boolean);
}
