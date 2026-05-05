import {
  act,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { syncCombatEncounterEnemies } from '../../../game/stateCombatEncounterSync';
import type { GameState } from '../../../game/stateTypes';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  waitForAppSelector,
} from './appTestHarness';
import {
  clickWorldTile,
  getRenderedGame,
  renderTickerFrame,
} from './appWorldMovementTestHelpers';

let setGameRef: MutableRefObject<Dispatch<SetStateAction<GameState>> | null> = {
  current: null,
};

function mockUseCombatAutomation() {
  vi.doMock('../useCombatAutomation', () => ({
    useCombatAutomation: ({
      setGame,
    }: {
      setGame: Dispatch<SetStateAction<GameState>>;
    }) => {
      setGameRef.current = setGame;
    },
  }));
}

describe('App world hostile click combat', () => {
  beforeEach(() => {
    setGameRef = { current: null };
    mockUseCombatAutomation();
  });

  afterEach(() => {
    vi.doUnmock('../useCombatAutomation');
  });

  it('starts adjacent hostile combat in place and auto-steps onto the hostile tile after victory', async () => {
    const game = createHydratedAppGame();
    game.enemies['enemy-1,0-0'] = {
      ...game.enemies['enemy-1,0-0']!,
      attack: 0,
      defense: 0,
      hp: 999,
      maxHp: 999,
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('../../../game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 1, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      const engagedGame = getRenderedGame();
      expect(engagedGame?.player.coord).toEqual({ q: 0, r: 0 });
      expect(engagedGame?.combat?.started).toBe(true);
      expect(engagedGame?.combat?.engagement).toMatchObject({
        autoStepOnVictory: true,
        engageMode: 'adjacent-click',
        stagingCoord: { q: 0, r: 0 },
        targetCoord: { q: 1, r: 0 },
      });

      await act(async () => {
        setGameRef.current?.((current) => {
          const next = structuredClone(current) as GameState;
          next.enemies['enemy-1,0-0']!.hp = 0;
          delete next.enemies['enemy-1,0-0'];
          syncCombatEncounterEnemies(next);
          return next;
        });
      });
      await flushLazyModules();
      await renderTickerFrame();

      const resolvedGame = getRenderedGame();
      expect(resolvedGame?.combat).toBeNull();
      expect(resolvedGame?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);
});
