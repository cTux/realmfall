import { act, useState, type Dispatch, type SetStateAction } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getCombatAutomationDelay } from '../../../game/stateCombat';
import type { GameState } from '../../../game/stateTypes';
import { useCombatAutomation } from './useCombatAutomationTestkit';

const progressCombatTransition = vi.fn();
const disposeTransitionSource = vi.fn(async () => undefined);

vi.mock('../../../game/stateCombat', async () => {
  const actual = await vi.importActual<
    typeof import('../../../game/stateCombat')
  >('../../../game/stateCombat');

  return {
    ...actual,
    getCombatAutomationDelay: vi.fn(),
  };
});

vi.mock('../gameplay/createWorkerGameplayTransitionSource', () => ({
  createWorkerGameplayTransitionSource: vi.fn(() => ({
    dispose: disposeTransitionSource,
    moveToTile: vi.fn(),
    progressCombat: progressCombatTransition,
    startCombat: vi.fn(),
  })),
}));

describe('useCombatAutomation', () => {
  let host: HTMLDivElement;
  let root: Root;
  const worldTimeMsRef = { current: 0 };

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    worldTimeMsRef.current = 0;
    vi.mocked(getCombatAutomationDelay).mockReturnValue(250);
    progressCombatTransition.mockImplementation(async (state) => ({
      changed: true,
      state: {
        ...state,
        worldTimeMs: worldTimeMsRef.current,
      },
    }));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('does not schedule combat automation while the game is paused', async () => {
    const setGame = vi.fn();
    const gameRef = {
      current: {
        combat: { started: true } as GameState['combat'],
        enemies: {},
        player: {
          mana: 0,
          statusEffects: [],
        },
      } as unknown as GameState,
    };

    function TestHarness() {
      useCombatAutomation({
        combat: gameRef.current.combat,
        enemyLookup: {},
        gameRef,
        paused: true,
        playerMana: 0,
        playerStatusEffects: [],
        setGame,
        worldTimeMsRef,
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(getCombatAutomationDelay).not.toHaveBeenCalled();
    expect(setGame).not.toHaveBeenCalled();
    expect(progressCombatTransition).not.toHaveBeenCalled();
  });

  it('schedules the next combat step after unpausing', async () => {
    const setGame = vi.fn();
    const gameRef = {
      current: {
        combat: { started: true } as GameState['combat'],
        enemies: {},
        player: {
          mana: 0,
          statusEffects: [],
        },
      } as unknown as GameState,
    };

    function TestHarness({ paused }: { paused: boolean }) {
      useCombatAutomation({
        combat: gameRef.current.combat,
        enemyLookup: {},
        gameRef,
        paused,
        playerMana: 0,
        playerStatusEffects: [],
        setGame,
        worldTimeMsRef,
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness paused />);
    });

    await act(async () => {
      root.render(<TestHarness paused={false} />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(getCombatAutomationDelay).toHaveBeenCalledTimes(2);
    expect(setGame).toHaveBeenCalledTimes(1);
  });

  it('keeps polling after a no-op combat tick until the world clock catches up', async () => {
    worldTimeMsRef.current = 0;
    vi.mocked(getCombatAutomationDelay).mockImplementation(
      (_state, worldTimeMs) => Math.max(0, 250 - worldTimeMs),
    );

    function TestHarness() {
      const [game, setGame] = useState({
        combat: { started: true } as GameState['combat'],
        enemies: {} as GameState['enemies'],
        player: {
          mana: 0,
          statusEffects: [],
        } as Pick<GameState['player'], 'mana' | 'statusEffects'>,
      });
      const gameRef = { current: game as unknown as GameState };
      gameRef.current = game as unknown as GameState;

      useCombatAutomation({
        combat: game.combat,
        enemyLookup: game.enemies,
        gameRef,
        paused: false,
        playerMana: game.player.mana,
        playerStatusEffects: game.player.statusEffects,
        setGame: setGame as Dispatch<SetStateAction<GameState>>,
        worldTimeMsRef,
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(progressCombatTransition).toHaveBeenCalledTimes(1);

    worldTimeMsRef.current = 250;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(progressCombatTransition).toHaveBeenCalledTimes(2);
  });

  it('ignores unrelated parent rerenders when the combat slices are unchanged', async () => {
    const setGame = vi.fn();
    const combat = { started: true } as GameState['combat'];
    const playerStatusEffects: GameState['player']['statusEffects'] = [];
    const enemyLookup: GameState['enemies'] = {};
    const gameRef = {
      current: {
        combat,
        enemies: enemyLookup,
        player: {
          mana: 0,
          statusEffects: playerStatusEffects,
        },
      } as unknown as GameState,
    };

    function TestHarness({ unrelated }: { unrelated: number }) {
      const appState = {
        combat,
        player: { statusEffects: playerStatusEffects },
        enemies: enemyLookup,
        unrelated,
      };

      useCombatAutomation({
        combat: appState.combat,
        enemyLookup: appState.enemies,
        gameRef,
        paused: false,
        playerMana: 0,
        playerStatusEffects: appState.player.statusEffects,
        setGame,
        worldTimeMsRef,
      });

      return <div data-unrelated={appState.unrelated} />;
    }

    await act(async () => {
      root.render(<TestHarness unrelated={0} />);
    });

    expect(getCombatAutomationDelay).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.render(<TestHarness unrelated={1} />);
    });

    expect(getCombatAutomationDelay).toHaveBeenCalledTimes(1);
  });
});
