import { act, useState, type Dispatch, type SetStateAction } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createGame } from '../../../game/stateFactory';
import { getResolvedCurrentTile } from '../../../game/stateSelectors';
import type { GameState } from '../../../game/stateTypes';
import { useGameplayAutomation } from '../hooks/useGameplayAutomation';

describe('useGameplayAutomation', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('auto-gathers a resource node with one state transition', async () => {
    const initialGame = createGame(2, 'auto-gather-optimization');
    initialGame.tiles['0,0'] = {
      ...initialGame.tiles['0,0'],
      items: [],
      structure: 'tree',
      structureHp: 5,
      structureMaxHp: 5,
    };

    const worldTimeMsRef = { current: initialGame.worldTimeMs };
    const renderedGameRef: { current: GameState } = { current: initialGame };
    let setGameCallCount = 0;

    function Harness() {
      const [game, setGameState] = useState(initialGame);
      renderedGameRef.current = game;
      const currentTile = getResolvedCurrentTile(game) ?? {
        coord: game.player.coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
      };
      const setGame: Dispatch<SetStateAction<GameState>> = (value) => {
        setGameCallCount += 1;
        setGameState(value);
      };

      useGameplayAutomation({
        combat: game.combat,
        currentTile,
        enabled: true,
        gameplaySettings: {
          autoGatherResources: true,
          autoLoot: false,
          autoStartCombat: false,
        },
        paused: false,
        setGame,
        worldTimeMsRef,
      });

      return null;
    }

    await act(async () => {
      root.render(<Harness />);
      await Promise.resolve();
    });

    expect(renderedGameRef.current.tiles['0,0']?.structure).toBeUndefined();
    expect(
      renderedGameRef.current.player.inventory.some(
        (item) => item.itemKey === 'logs',
      ),
    ).toBe(true);
    expect(
      renderedGameRef.current.logs.filter((entry) => entry.kind === 'loot'),
    ).toHaveLength(1);
    expect(setGameCallCount).toBe(1);
  });
});
