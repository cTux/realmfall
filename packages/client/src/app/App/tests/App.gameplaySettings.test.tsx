import { act } from 'react';
import { moveToTile } from '../../../game/state';
import {
  renderApp,
  createHydratedAppGame,
  loadEncryptedState,
} from './appTestkit';
import { getRenderedGame } from './appWorldMovementTestkit';

const GAMEPLAY_SETTINGS_STORAGE_KEY = 'realmfall-settings-gameplay';

describe('App gameplay settings', () => {
  it('auto-loots the current tile when the setting is enabled', async () => {
    const game = createHydratedAppGame();
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    window.localStorage.setItem(
      GAMEPLAY_SETTINGS_STORAGE_KEY,
      JSON.stringify({ autoLoot: true }),
    );

    const { host, root } = await renderApp();

    expect(getRenderedGame()?.tiles['0,0']?.items).toEqual([]);
    expect(
      getRenderedGame()?.player.inventory.some((item) => item.name === 'Gold'),
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10_000);

  it('ignores a removed auto-start combat setting while hydrating an already-started encounter', async () => {
    const game = moveToTile(createHydratedAppGame(), { q: 1, r: 0 });
    expect(game.combat?.started).toBe(true);

    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    window.localStorage.setItem(
      GAMEPLAY_SETTINGS_STORAGE_KEY,
      JSON.stringify({ autoStartCombat: true }),
    );

    const { host, root } = await renderApp();

    expect(getRenderedGame()?.combat?.started).toBe(true);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10_000);

  it('auto-gathers the current structure until it is depleted', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [],
      structure: 'tree',
      structureHp: 5,
      structureMaxHp: 5,
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    window.localStorage.setItem(
      GAMEPLAY_SETTINGS_STORAGE_KEY,
      JSON.stringify({ autoGatherResources: true }),
    );

    const { host, root } = await renderApp();

    expect(getRenderedGame()?.tiles['0,0']?.structure).toBeUndefined();
    expect(
      getRenderedGame()?.player.inventory.some((item) => item.name === 'Logs'),
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10_000);
});
