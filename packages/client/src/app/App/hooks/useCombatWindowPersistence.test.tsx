import { act } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { moveToTile, type GameState } from '../../../game/state';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from '../tests/appTestkit';
import { renderWindowHotkeyLabelText } from '../../../ui/hotkeyLabels';
import { WINDOW_LABELS } from '../../../ui/windowLabels';

let setGameRef: MutableRefObject<Dispatch<SetStateAction<GameState>> | null> = {
  current: null,
};
let latestGameRef: MutableRefObject<GameState | null> = {
  current: null,
};

function mockUsePixiWorld() {
  vi.doMock('../usePixiWorld', async () => {
    const react = await import('react');

    return {
      usePixiWorld: ({
        setGame,
      }: {
        setGame: Dispatch<SetStateAction<GameState>>;
      }) => {
        setGameRef.current = (updater) =>
          setGame((current) => {
            const next =
              typeof updater === 'function'
                ? (updater as (state: GameState) => GameState)(current)
                : updater;
            latestGameRef.current = next;
            return next;
          });

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

describe('combat hex content persistence', () => {
  beforeEach(() => {
    setGameRef = { current: null };
    latestGameRef = { current: null };
    mockUsePixiWorld();
  });

  it('keeps the combat hex-content window open after an auto-opened combat ends', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [],
      structure: undefined,
    };
    loadEncryptedState.mockResolvedValue({
      game,
      ui: {
        windowShown: {
          hero: false,
          skills: false,
          recipes: false,
          hexInfo: false,
          equipment: false,
          inventory: false,
          loot: false,
          log: false,
          combat: false,
          settings: false,
        },
      },
    });

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(findHexContentDockButton(host)?.dataset.opened).toBe('false');

    await act(async () => {
      setGameRef.current?.((current) =>
        moveToTile(
          { ...current, worldTimeMs: current.worldTimeMs },
          { q: 1, r: 0 },
        ),
      );
    });
    await flushLazyModules();
    await flushLazyModules();

    expect(latestGameRef.current?.player.coord).toEqual({ q: 1, r: 0 });
    expect(latestGameRef.current?.combat).not.toBeNull();
    expect(findHexContentDockButton(host)?.dataset.opened).toBe('true');

    await act(async () => {
      setGameRef.current?.((current) => ({
        ...current,
        combat: null,
        tiles: {
          ...current.tiles,
          '1,0': {
            ...current.tiles['1,0'],
            enemyIds: [],
            items: [],
            structure: undefined,
          },
        },
      }));
    });
    await flushLazyModules();
    await flushLazyModules();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    await flushLazyModules();

    expect(latestGameRef.current?.combat).toBeNull();
    expect(host.textContent).toContain(
      renderWindowHotkeyLabelText(WINDOW_LABELS.hexInfo),
    );
    expect(findHexContentDockButton(host)?.dataset.opened).toBe('true');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10_000);
});

function findHexContentDockButton(host: HTMLElement) {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    button.getAttribute('aria-label')?.startsWith('Toggle Hex Content window'),
  ) as HTMLButtonElement | undefined;
}
