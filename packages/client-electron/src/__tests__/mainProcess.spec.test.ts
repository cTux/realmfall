import { vi } from 'vitest';
import { createMainProcessController } from '../mainProcess.js';

describe('createMainProcessController', () => {
  it('starts the static server in production and creates one BrowserWindow', async () => {
    const createdWindows: Array<{
      loadURL: ReturnType<typeof vi.fn>;
      once: ReturnType<typeof vi.fn>;
      show: ReturnType<typeof vi.fn>;
    }> = [];
    const loadURL = vi.fn().mockResolvedValue(undefined);
    const once = vi.fn((_event: string, callback: () => void) => callback());

    const BrowserWindow = vi.fn(function BrowserWindow() {
      const window = {
        loadURL,
        once,
        show: vi.fn(),
      };
      createdWindows.push(window);
      return window;
    });

    const startServer = vi.fn().mockResolvedValue({
      close: vi.fn(),
      origin: 'http://127.0.0.1:43110',
    });

    const controller = createMainProcessController({
      BrowserWindow,
      app: {
        on: vi.fn(),
        quit: vi.fn(),
        whenReady: vi.fn().mockResolvedValue(undefined),
      },
      startStaticServer: startServer,
    });

    await controller.start({
      appMode: 'production',
      cwd: '/workspace/packages/client-electron',
    });

    expect(startServer).toHaveBeenCalledTimes(1);
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(createdWindows).toHaveLength(1);
    expect(loadURL).toHaveBeenCalledWith('http://127.0.0.1:43110/index.html');
  });
});
