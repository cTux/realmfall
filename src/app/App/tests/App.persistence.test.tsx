import { act } from 'react';
import { createGame } from '../../../game/stateFactory';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  saveEncryptedState,
  waitForAppSelector,
} from './appTestHarness';

async function flushAutosaveTimers(ms = 5000) {
  await vi.advanceTimersByTimeAsync(ms);
  await vi.runOnlyPendingTimersAsync();
}

describe('App persistence', () => {
  it('autosaves UI changes without requiring gameplay mutations', async () => {
    const game = createGame(2, 'app-ui-save-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();
    await waitForAppSelector(host, 'canvas');

    saveEncryptedState.mockClear();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'c' }),
      );
    });

    await act(async () => {
      await flushAutosaveTimers();
    });

    expect(saveEncryptedState).toHaveBeenCalledWith(
      expect.objectContaining({
        game: expect.objectContaining({
          worldTimeMs: expect.any(Number),
        }),
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ hexInfo: true }),
        }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 2_000);

  it('toggles the settings window with the M hotkey and saves that UI state', async () => {
    const game = createGame(2, 'app-settings-ui-save-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();
    await waitForAppSelector(host, 'canvas');

    saveEncryptedState.mockClear();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'm' }),
      );
    });

    await act(async () => {
      await flushAutosaveTimers();
    });

    expect(saveEncryptedState).toHaveBeenCalledWith(
      expect.objectContaining({
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ settings: true }),
        }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('opens the settings window at its saved size', async () => {
    const game = createGame(2, 'app-settings-window-size-seed');
    loadEncryptedState.mockResolvedValue({
      game,
      ui: {
        windows: {
          settings: { x: 240, y: 120, width: 720, height: 560 },
        },
      },
    });

    const { host, root } = await renderApp();
    await flushLazyModules();
    await waitForAppSelector(host, 'canvas');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'm' }),
      );
    });
    await flushLazyModules();

    const saveButton = (await waitForAppSelector(
      host,
      'button',
    )) as HTMLButtonElement;
    const settingsSaveButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Save',
    );
    const settingsWindow = (settingsSaveButton ?? saveButton).closest(
      'section',
    );

    expect(settingsWindow).not.toBeNull();
    expect((settingsWindow as HTMLElement).style.width).toBe('720px');
    expect((settingsWindow as HTMLElement).style.height).toBe('560px');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('saves assigned action bar slots alongside window state', async () => {
    const game = createGame(2, 'app-action-bar-save-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();
    await waitForAppSelector(host, 'canvas');

    saveEncryptedState.mockClear();

    const actionBarSlot = (await waitForAppSelector(
      host,
      '[aria-label="Empty action bar slot 1"]',
    )) as HTMLButtonElement;

    await act(async () => {
      actionBarSlot.click();
    });

    const assignButton = (await waitForAppSelector(
      host,
      '[aria-label="Assign Trail Ration to action bar slot"]',
    )) as HTMLButtonElement;

    await act(async () => {
      assignButton.click();
    });

    await act(async () => {
      await flushAutosaveTimers();
    });

    expect(saveEncryptedState).toHaveBeenCalledWith(
      expect.objectContaining({
        ui: expect.objectContaining({
          actionBarSlots: [
            expect.objectContaining({
              item: expect.objectContaining({ name: 'Trail Ration' }),
            }),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ],
        }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
