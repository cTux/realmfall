import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  getCombatAutomationDelay,
  progressCombat,
  type GameState,
} from '../../../game/state';
import { useCombatAutomation } from '../useCombatAutomation';

vi.mock('../../../game/state', async () => {
  const actual = await vi.importActual<typeof import('../../../game/state')>(
    '../../../game/state',
  );

  return {
    ...actual,
    getCombatAutomationDelay: vi.fn(),
    progressCombat: vi.fn((state) => state),
  };
});

describe('useCombatAutomation', () => {
  let host: HTMLDivElement;
  let root: Root;

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
    vi.mocked(getCombatAutomationDelay).mockReturnValue(250);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('does not schedule combat automation while the game is paused', async () => {
    const setGame = vi.fn();

    function TestHarness() {
      useCombatAutomation({
        game: {
          combat: { started: true },
          player: {},
          enemies: {},
        } as Pick<GameState, 'combat' | 'player' | 'enemies'>,
        paused: true,
        setGame,
        worldTimeMsRef: { current: 0 },
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(getCombatAutomationDelay).not.toHaveBeenCalled();
    expect(setGame).not.toHaveBeenCalled();
    expect(progressCombat).not.toHaveBeenCalled();
  });

  it('schedules the next combat step after unpausing', async () => {
    const setGame = vi.fn();

    function TestHarness({ paused }: { paused: boolean }) {
      useCombatAutomation({
        game: {
          combat: { started: true },
          player: {},
          enemies: {},
        } as Pick<GameState, 'combat' | 'player' | 'enemies'>,
        paused,
        setGame,
        worldTimeMsRef: { current: 0 },
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

    expect(getCombatAutomationDelay).toHaveBeenCalledTimes(1);
    expect(setGame).toHaveBeenCalledTimes(1);
  });
});
