import { act } from 'react';
import {
  applyGraphicsPreset,
  saveGraphicsSettings,
} from '../../graphicsSettings';
import {
  applicationOptions,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

describe('App canvas setup', () => {
  it('caps the Pixi resolution with the default balanced preset', async () => {
    vi.stubGlobal('devicePixelRatio', 3);
    loadEncryptedState.mockResolvedValue(null);

    const { App } = await import('../index');
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { value: 800 });
    Object.defineProperty(host, 'clientHeight', { value: 600 });
    document.body.appendChild(host);
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(host);

    await act(async () => {
      root.render(<App />);
    });
    await flushLazyModules();

    expect(applicationOptions[0]).toMatchObject({
      autoDensity: true,
      resolution: 1.5,
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10000);

  it('hydrates Pixi initialization flags from saved graphics settings', async () => {
    loadEncryptedState.mockResolvedValue(null);
    saveGraphicsSettings({
      preset: 'custom',
      resolutionCap: 1.5,
      antialias: false,
      autoDensity: false,
      clearBeforeRender: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      useContextAlpha: false,
    });

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(applicationOptions[0]).toMatchObject({
      antialias: false,
      autoDensity: false,
      backgroundAlpha: 1,
      clearBeforeRender: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('hydrates the performance preset into Pixi resolution and antialiasing', async () => {
    vi.stubGlobal('devicePixelRatio', 2.5);
    loadEncryptedState.mockResolvedValue(null);
    saveGraphicsSettings(applyGraphicsPreset('performance'));

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(applicationOptions[0]).toMatchObject({
      antialias: false,
      autoDensity: true,
      resolution: 1,
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
