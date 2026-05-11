import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const ELECTRON_STATIC_SERVER_PORT = 43110;

export type RuntimeConfigInput = {
  appMode: 'development' | 'production';
  cwd?: string;
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
  const packageRoot = cwd ?? fileURLToPath(new URL('..', import.meta.url));
  const stagedClientWebDistPath = resolve(packageRoot, 'dist/client-web');
  const clientWebDistPath = existsSync(stagedClientWebDistPath)
    ? stagedClientWebDistPath
    : resolve(packageRoot, '../client-web/dist');

  return {
    clientWebDistPath,
    mode: appMode,
    preloadPath: resolve(packageRoot, 'dist/preload.js'),
    rendererUrl:
      appMode === 'development'
        ? rendererDevUrl
        : `http://127.0.0.1:${ELECTRON_STATIC_SERVER_PORT}/index.html`,
  };
}
