import { resolveRuntimeConfig } from '../runtimeConfig.js';
import { buildWindowOptions, resolveWindowTargetUrl } from '../window.js';

describe('window helpers', () => {
  it('builds a hardened BrowserWindow config and uses the renderer url from runtime config', () => {
    const runtimeConfig = resolveRuntimeConfig({
      appMode: 'development',
      cwd: '/workspace/packages/client-electron',
      rendererDevUrl: 'https://localhost:5173',
    });

    expect(resolveWindowTargetUrl(runtimeConfig)).toBe(
      'https://localhost:5173',
    );

    expect(buildWindowOptions(runtimeConfig)).toMatchObject({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: runtimeConfig.preloadPath,
        sandbox: true,
      },
    });
  });
});
