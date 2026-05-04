import { act } from 'react';
import { buildItemFromConfig } from '../../../game/content/items';
import { ItemId } from '../../../game/content/ids';
import { generateDungeonWorld } from '../../../game/dungeons/generation/generateDungeonWorld';
import { hexKey } from '../../../game/hex';
import type { GameState } from '../../../game/stateTypes';
import styles from '../styles.module.scss';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedDungeonState,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

let latestGame: GameState | null = null;

function mockUsePixiWorld() {
  vi.doMock('../usePixiWorld', async () => {
    const react = await import('react');

    return {
      usePixiWorld: ({ game }: { game: GameState }) => {
        latestGame = game;

        return {
          hostRef: react.useRef<HTMLDivElement | null>(null),
          canvasReady: true,
          canvasError: false,
          queuedTravelAutoOpenSuppressed: false,
          retryCanvas: vi.fn(),
        };
      },
    };
  });
}

describe('App dungeon flow', () => {
  beforeEach(() => {
    latestGame = null;
    mockUsePixiWorld();
  });

  it('shows fullscreen loading while entering a dungeon and returns to the same surface entrance on leave', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [],
      structure: 'dungeon',
    };

    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const dungeonId = `dungeon:${game.seed}:0,0`;
    const savedWorld = generateDungeonWorld({
      dungeonId,
      gameRadius: game.radius,
      seed: game.seed,
      surfaceCoord: { q: 0, r: 0 },
    });
    const dungeonEntranceKey = hexKey(savedWorld.dungeon.entranceCoord);
    savedWorld.tiles[dungeonEntranceKey] = {
      ...savedWorld.tiles[dungeonEntranceKey],
      items: [
        buildItemFromConfig(ItemId.Gold, {
          id: 'saved-dungeon-gold',
          quantity: 17,
        }),
      ],
    };

    let resolveDungeonLoad: ((world: typeof savedWorld | null) => void) | null =
      null;
    loadEncryptedDungeonState.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDungeonLoad = resolve;
        }),
    );

    const { host, root } = await renderApp();
    await flushLazyModules();

    const enterDungeonButton = findButtonByText(host, 'Enter dungeon');
    expect(enterDungeonButton).not.toBeNull();

    await act(async () => {
      enterDungeonButton?.click();
    });

    expect(loadEncryptedDungeonState).toHaveBeenCalledWith(dungeonId);
    expect(host.querySelector(`.${styles.loadingScreen}`)).not.toBeNull();
    expect(host.querySelector('[aria-label="Action bar"]')).not.toBeNull();

    await act(async () => {
      resolveDungeonLoad?.(savedWorld);
      await Promise.resolve();
    });
    await flushLazyModules();

    expect(host.querySelector(`.${styles.loadingScreen}`)).toBeNull();
    expect(latestGame?.activeDungeon?.dungeonId).toBe(dungeonId);
    expect(latestGame?.player.coord).toEqual(savedWorld.dungeon.entranceCoord);
    expect(latestGame?.tiles[dungeonEntranceKey]?.items).toEqual(
      savedWorld.tiles[dungeonEntranceKey]?.items,
    );

    const leaveDungeonButton = findButtonByText(host, 'Leave dungeon');
    expect(leaveDungeonButton).not.toBeNull();

    await act(async () => {
      leaveDungeonButton?.click();
    });

    expect(host.querySelector(`.${styles.loadingScreen}`)).not.toBeNull();

    await flushLazyModules();

    expect(host.querySelector(`.${styles.loadingScreen}`)).toBeNull();
    expect(latestGame?.activeDungeon).toBeNull();
    expect(latestGame?.player.coord).toEqual({ q: 0, r: 0 });
    expect(findButtonByText(host, 'Enter dungeon')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 20_000);
});

function findButtonByText(host: HTMLElement, text: string) {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => button.textContent?.includes(text),
  );
}
