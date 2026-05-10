import { act } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { createStartedCombatEncounter } from '@realmfall/core/game/stateCombatEngagement';
import type { GameState } from '@realmfall/core/game/stateTypes';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from '../tests/appTestkit';

let setGameRef: MutableRefObject<Dispatch<SetStateAction<GameState>> | null> = {
  current: null,
};

vi.mock('../usePixiWorld', async () => {
  const react = await import('react');

  return {
    usePixiWorld: ({
      setGame,
    }: {
      setGame: Dispatch<SetStateAction<GameState>>;
    }) => {
      setGameRef.current = setGame;

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

describe('enemy chase combat window auto-open', () => {
  beforeEach(() => {
    setGameRef = { current: null };
  });

  it('keeps hex content closed when an enemy chase starts combat after a player move', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [],
      structure: undefined,
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['1,1'] = {
      coord: { q: 1, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-1,1-0'],
    };
    game.enemies['enemy-1,1-0'] = {
      id: 'enemy-1,1-0',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 1, r: 1 },
      tier: 2,
      hp: 5,
      maxHp: 5,
      attack: 1,
      defense: 0,
      xp: 2,
      elite: false,
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
      setGameRef.current?.((current) => {
        const next = {
          ...current,
          logs: [...current.logs],
          player: {
            ...current.player,
            coord: { q: 0, r: 1 },
          },
        };
        next.combat = createStartedCombatEncounter(next, {
          autoStepOnVictory: false,
          engageMode: 'enemy-chase',
          enemyIds: ['enemy-1,1-0'],
          originCoord: { q: 0, r: 1 },
          stagingCoord: { q: 0, r: 1 },
          targetCoord: { q: 1, r: 1 },
          worldTimeMs: next.worldTimeMs,
        });
        return next;
      });
    });
    await flushLazyModules();

    expect(findHexContentDockButton(host)?.dataset.opened).toBe('false');

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
