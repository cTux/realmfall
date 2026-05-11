import { resolve } from 'node:path';

export type RuntimeConfigInput = {
  appMode: 'development' | 'production';
  cwd: string;
  rendererDevUrl?: string;
};

export type RuntimeConfig = {
  clientWebDistPath: string;
  mode: 'development' | 'production';
  preloadPath: string;
  rendererUrl: string;
};

export function resolveRuntimeConfig({
  appMode,
  cwd,
  rendererDevUrl = 'https://localhost:5173',
}: RuntimeConfigInput): RuntimeConfig {
  const packageRoot = cwd;
  const repoRoot = resolve(packageRoot, '../..');
  const clientWebDistPath = resolve(repoRoot, 'packages/client-web/dist');

  return {
    clientWebDistPath,
    mode: appMode,
    preloadPath: resolve(packageRoot, 'dist/preload.js'),
    rendererUrl:
      appMode === 'development'
        ? rendererDevUrl
        : 'http://127.0.0.1:43110/index.html',
  };
}
