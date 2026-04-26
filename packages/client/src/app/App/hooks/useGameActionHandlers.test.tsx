import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../../game/stateFactory';
import type { GameState } from '../../../game/stateTypes';
import { useGameActionHandlers } from './useGameActionHandlers';

describe('useGameActionHandlers', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('logs a command entry when an intentional inventory action changes game state', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let latestGame = createGame(2, 'logged-sort-command');
    const gameRef: { current: GameState } = { current: latestGame };
    let handlers: ReturnType<typeof useGameActionHandlers> | null = null;

    function Harness() {
      handlers = useGameActionHandlers({
        paused: false,
        setGame: (value) => {
          latestGame = typeof value === 'function' ? value(latestGame) : value;
          gameRef.current = latestGame;
        },
        worldTimeMsRef: { current: gameRef.current.worldTimeMs },
      });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      handlers?.handleSort();
    });

    expect(latestGame.logs[0]?.kind).toBe('command');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('does not log a command entry when paused blocks the command', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let latestGame = createGame(2, 'paused-sort-command');
    const initialSequence = latestGame.logSequence;
    const gameRef: { current: GameState } = { current: latestGame };
    let handlers: ReturnType<typeof useGameActionHandlers> | null = null;

    function Harness() {
      handlers = useGameActionHandlers({
        paused: true,
        setGame: (value) => {
          latestGame = typeof value === 'function' ? value(latestGame) : value;
          gameRef.current = latestGame;
        },
        worldTimeMsRef: { current: gameRef.current.worldTimeMs },
      });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      handlers?.handleSort();
    });

    expect(latestGame.logSequence).toBe(initialSequence);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
