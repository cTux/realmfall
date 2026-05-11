import type { BrowserWindowConstructorOptions } from 'electron';
import type { RuntimeConfig } from './runtimeConfig.js';

export function resolveWindowTargetUrl(runtimeConfig: RuntimeConfig) {
  return runtimeConfig.rendererUrl;
}

export function buildWindowOptions(
  runtimeConfig: RuntimeConfig,
): BrowserWindowConstructorOptions {
  return {
    backgroundColor: '#101419',
    height: 900,
    minHeight: 720,
    minWidth: 1280,
    show: false,
    width: 1440,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: runtimeConfig.preloadPath,
      sandbox: true,
    },
  };
}
