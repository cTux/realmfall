import { act } from 'react';
import { createGame } from '../../../game/state';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  saveEncryptedState,
} from './appTestHarness';

describe('App persistence', () => {
  it('autosaves UI-only changes without requiring gameplay mutations', async () => {
    const game = createGame(2, 'app-ui-save-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    saveEncryptedState.mockClear();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'c' }),
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(saveEncryptedState).toHaveBeenCalledWith(
      expect.objectContaining({
        game: expect.objectContaining({
          turn: game.turn,
          logs: [],
        }),
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ hero: true }),
        }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('toggles the settings window with the M hotkey and saves that UI state', async () => {
    const game = createGame(2, 'app-settings-ui-save-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    saveEncryptedState.mockClear();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'm' }),
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
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
});
