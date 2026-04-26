import { act } from 'react';
import {
  applyGraphicsPreset,
  DEFAULT_WORLD_RENDER_FPS,
  saveGraphicsSettings,
} from '../../graphicsSettings';
import { t } from '../../../i18n';
import {
  applicationOptions,
  ensureWorldIconTexturesLoaded,
  flushLazyModules,
  getVisibleWorldIconAssetIds,
  loadEncryptedState,
  renderApp,
  renderScene,
  tickerCallbacks,
  tickerMaxFpsValues,
  warmWorldIconTexturesInBackground,
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
  }, 2_000);

  it('hydrates Pixi initialization flags from saved graphics settings', async () => {
    loadEncryptedState.mockResolvedValue(null);
    saveGraphicsSettings({
      preset: 'custom',
      resolutionCap: 1.5,
      worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
      antialias: false,
      autoDensity: false,
      clearBeforeRender: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      showTerrainBackgrounds: false,
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

  it('passes the terrain background toggle into world renders', async () => {
    loadEncryptedState.mockResolvedValue(null);
    saveGraphicsSettings({
      ...applyGraphicsPreset('balanced'),
      preset: 'custom',
      showTerrainBackgrounds: false,
    });

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(renderScene).toHaveBeenCalled();
    expect(renderScene.mock.calls[0]?.[8]).toEqual({
      showTerrainBackgrounds: false,
      worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('hydrates the saved Pixi render FPS into the world ticker', async () => {
    loadEncryptedState.mockResolvedValue(null);
    saveGraphicsSettings({
      ...applyGraphicsPreset('balanced'),
      preset: 'custom',
      worldRenderFps: 144,
    });

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(tickerMaxFpsValues[tickerMaxFpsValues.length - 1]).toBe(144);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('updates the Pixi render FPS without recreating the renderer', async () => {
    loadEncryptedState.mockResolvedValue({
      ui: {
        windowShown: {
          settings: true,
        },
      },
    });

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(applicationOptions).toHaveLength(1);
    expect(tickerMaxFpsValues[tickerMaxFpsValues.length - 1]).toBe(60);

    const renderFpsSlider = host.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement | null;
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) => candidate.textContent === t('ui.settings.actions.save'),
    );

    expect(renderFpsSlider).not.toBeNull();
    expect(saveButton).toBeDefined();

    await act(async () => {
      if (renderFpsSlider) {
        const setValue = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set;

        setValue?.call(renderFpsSlider, '120');
        renderFpsSlider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flushLazyModules();

    expect(applicationOptions).toHaveLength(1);
    expect(tickerMaxFpsValues[tickerMaxFpsValues.length - 1]).toBe(120);

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

  it('does not recreate Pixi when saving init-only graphics settings without reload', async () => {
    loadEncryptedState.mockResolvedValue({
      ui: {
        windowShown: {
          settings: true,
        },
      },
    });

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(applicationOptions).toHaveLength(1);

    const antialiasSwitch = Array.from(host.querySelectorAll('label'))
      .find((candidate) =>
        candidate.textContent?.includes(
          t('ui.settings.graphics.antialias.label'),
        ),
      )
      ?.querySelector('input[type="checkbox"]');
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) => candidate.textContent === t('ui.settings.actions.save'),
    );

    expect(antialiasSwitch).toBeDefined();
    expect(saveButton).toBeDefined();

    await act(async () => {
      antialiasSwitch?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flushLazyModules();

    expect(applicationOptions).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('coalesces idle ticker renders inside the same animation bucket', async () => {
    loadEncryptedState.mockResolvedValue(null);
    let now = 1_000;
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now);

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(renderScene).toHaveBeenCalledTimes(1);

    await act(async () => {
      tickerCallbacks.forEach((callback) => callback());
      tickerCallbacks.forEach((callback) => callback());
    });

    expect(renderScene).toHaveBeenCalledTimes(1);

    now += 40;

    await act(async () => {
      tickerCallbacks.forEach((callback) => callback());
    });

    expect(renderScene).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('preloads initial visible icons before Pixi init and warms the full catalog after boot', async () => {
    loadEncryptedState.mockResolvedValue(null);

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(getVisibleWorldIconAssetIds).toHaveBeenCalled();
    expect(ensureWorldIconTexturesLoaded).toHaveBeenCalledWith([
      'visible-start-icon',
    ]);
    expect(warmWorldIconTexturesInBackground).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('surfaces a retry path when Pixi bootstrap fails before canvas init', async () => {
    loadEncryptedState.mockResolvedValue(null);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    ensureWorldIconTexturesLoaded
      .mockRejectedValueOnce(new Error('icon preload failed'))
      .mockResolvedValueOnce(undefined);

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      expect(host.textContent).toContain('World renderer failed to start.');
      const retryButton = Array.from(host.querySelectorAll('button')).find(
        (button) => button.textContent === 'Retry',
      );
      expect(retryButton).toBeDefined();
      expect(applicationOptions).toHaveLength(0);

      await act(async () => {
        retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await flushLazyModules();

      expect(applicationOptions).toHaveLength(1);
      expect(host.textContent).not.toContain('World renderer failed to start.');
      expect(errorSpy).toHaveBeenCalled();

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
