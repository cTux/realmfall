import { act } from 'react';
import {
  applyGraphicsPreset,
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
});
