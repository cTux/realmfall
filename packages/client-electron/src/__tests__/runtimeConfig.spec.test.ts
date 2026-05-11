import { mkdtemp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveRuntimeConfig } from '../runtimeConfig.js';

describe('resolveRuntimeConfig', () => {
  it('returns the dev renderer url without touching the built client path', () => {
    const config = resolveRuntimeConfig({
      appMode: 'development',
      cwd: '/workspace/packages/client-electron',
      rendererDevUrl: 'https://localhost:5173',
    });

    expect(config.mode).toBe('development');
    expect(config.rendererUrl).toBe('https://localhost:5173');
    expect(
      config.clientWebDistPath
        .replaceAll('\\', '/')
        .endsWith('/packages/client-web/dist'),
    ).toBe(true);
    expect(
      config.preloadPath.replaceAll('\\', '/').endsWith('/dist/preload.js'),
    ).toBe(true);
  });

  it('prefers the staged renderer build when the electron package owns one', async () => {
    const packageRoot = await mkdtemp(join(tmpdir(), 'realmfall-electron-'));
    await mkdir(join(packageRoot, 'dist', 'client-web'), { recursive: true });

    const config = resolveRuntimeConfig({
      appMode: 'production',
      cwd: packageRoot,
    });

    expect(
      config.clientWebDistPath
        .replaceAll('\\', '/')
        .endsWith('/dist/client-web'),
    ).toBe(true);
  });
});
