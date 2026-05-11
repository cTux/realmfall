import { app, BrowserWindow } from 'electron';
import type {
  App as ElectronApp,
  BrowserWindowConstructorOptions,
} from 'electron';
import process from 'node:process';
import {
  ELECTRON_STATIC_SERVER_PORT,
  resolveRuntimeConfig,
  type RuntimeConfigInput,
} from './runtimeConfig.js';
import { startStaticServer, type StaticServerHandle } from './staticServer.js';
import { buildWindowOptions, resolveWindowTargetUrl } from './window.js';

type AppLike = Pick<ElectronApp, 'on' | 'quit' | 'whenReady'>;

type BrowserWindowLike = {
  loadURL: (url: string) => Promise<void>;
  once: (event: string, listener: () => void) => void;
  show: () => void;
};

type BrowserWindowConstructor = new (
  options: BrowserWindowConstructorOptions,
) => BrowserWindowLike;

type MainProcessDependencies = {
  BrowserWindow: BrowserWindowConstructor;
  app: AppLike;
  startStaticServer: (options: {
    distDir: string;
    port: number;
  }) => Promise<StaticServerHandle>;
};

export function createMainProcessController(
  deps: MainProcessDependencies = {
    BrowserWindow: BrowserWindow as unknown as BrowserWindowConstructor,
    app,
    startStaticServer,
  },
) {
  let serverHandle: StaticServerHandle | null = null;

  return {
    async start(options: RuntimeConfigInput) {
      const runtimeConfig = resolveRuntimeConfig(options);

      await deps.app.whenReady();

      if (runtimeConfig.mode === 'production') {
        serverHandle = await deps.startStaticServer({
          distDir: runtimeConfig.clientWebDistPath,
          port: ELECTRON_STATIC_SERVER_PORT,
        });
        runtimeConfig.rendererUrl = `${serverHandle.origin}/index.html`;
      }

      const window = new deps.BrowserWindow(buildWindowOptions(runtimeConfig));
      window.once('ready-to-show', () => window.show());
      await window.loadURL(resolveWindowTargetUrl(runtimeConfig));

      deps.app.on('window-all-closed', () => {
        void serverHandle?.close();
        if (process.platform !== 'darwin') {
          deps.app.quit();
        }
      });

      return window;
    },
  };
}
