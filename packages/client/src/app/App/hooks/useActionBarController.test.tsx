import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../../game/stateFactory';
import type { GameState } from '../../../game/stateTypes';
import { useActionBarController } from './useActionBarController';

describe('useActionBarController', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('logs a command entry when a valid action bar slot is used', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let latestGame = createGame(2, 'action-bar-command');
    latestGame.player.hp = Math.max(1, latestGame.player.hp - 5);
    const gameRef: { current: GameState } = { current: latestGame };
    let controller: ReturnType<typeof useActionBarController> | null = null;

    function Harness() {
      controller = useActionBarController({
        applyGameTransition: (transition) => {
          latestGame = transition(latestGame);
          gameRef.current = latestGame;
        },
        gameRef,
        inventory: latestGame.player.inventory,
      });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      controller?.handleAssignActionBarSlot(0, latestGame.player.inventory[2]!);
    });

    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      controller?.handleUseActionBarSlot(0);
    });

    expect(latestGame.logs[0]?.kind).toBe('command');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('does not log when the chosen action bar slot has no valid item', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let latestGame = createGame(2, 'empty-action-bar-command');
    const initialSequence = latestGame.logSequence;
    const gameRef: { current: GameState } = { current: latestGame };
    let controller: ReturnType<typeof useActionBarController> | null = null;

    function Harness() {
      controller = useActionBarController({
        applyGameTransition: (transition) => {
          latestGame = transition(latestGame);
          gameRef.current = latestGame;
        },
        gameRef,
        inventory: latestGame.player.inventory,
      });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      controller?.handleUseActionBarSlot(0);
    });

    expect(latestGame.logSequence).toBe(initialSequence);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
