import { act } from 'react';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

describe('App item tooltip lazy loading', () => {
  afterEach(() => {
    vi.doUnmock('../../../ui/tooltips');
  });

  it('swallows rejected item tooltip chunk loads during inventory hover', async () => {
    const game = createHydratedAppGame();
    const tooltipLoadError = new Error('tooltip chunk failed');
    const onUnhandledRejection = vi.fn((event: PromiseRejectionEvent) => {
      event.preventDefault();
    });

    loadEncryptedState.mockResolvedValue({
      game,
      ui: {
        windowShown: {
          hero: false,
          skills: false,
          recipes: false,
          hexInfo: false,
          equipment: false,
          inventory: true,
          loot: false,
          log: false,
          combat: false,
          settings: false,
        },
      },
    });

    vi.doMock('../../../ui/tooltips', async () => {
      throw tooltipLoadError;
    });
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    const { host, root } = await renderApp();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await flushLazyModules();
    await flushLazyModules();

    const inventoryConsumable = host.querySelector('[aria-label="consumable"]')
      ?.parentElement as HTMLButtonElement | null;
    expect(inventoryConsumable).not.toBeNull();

    await act(async () => {
      inventoryConsumable?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
      await vi.dynamicImportSettled();
      await Promise.resolve();
    });

    expect(onUnhandledRejection).not.toHaveBeenCalled();
    expect(host.querySelector('[data-tooltip-visible="true"]')).toBeNull();

    window.removeEventListener('unhandledrejection', onUnhandledRejection);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10000);
});
