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
});
