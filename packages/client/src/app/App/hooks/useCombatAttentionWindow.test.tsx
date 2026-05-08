import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { createStartedCombatEncounter } from '../../../game/stateCombatEngagement';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { createWindowVisibilityState } from '../../constants';
import { createHydratedAppGame } from '../tests/appTestkit';
import { useCombatAttentionWindow } from './useCombatAttentionWindow';
import { useHexInfoWindowPromotion } from './useHexInfoWindowPromotion';

describe('combat hex info hook interplay', () => {
  it('keeps hex info open when combat ends after opening during combat', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createHydratedAppGame();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [],
      structure: undefined,
    };
    const combat = createStartedCombatEncounter(game, {
      autoStepOnVictory: false,
      engageMode: 'tile-step',
      enemyIds: ['enemy-1,0-0'],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 1, r: 0 },
      targetCoord: { q: 1, r: 0 },
      worldTimeMs: game.worldTimeMs,
    });

    await renderHarness(root, { combat: null, playerCoord: { q: 0, r: 0 } });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('false');

    await renderHarness(root, { combat, playerCoord: { q: 1, r: 0 } });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('true');

    await renderHarness(root, { combat: null, playerCoord: { q: 1, r: 0 } });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('true');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

function Harness({
  combat,
  playerCoord,
}: {
  combat: GameState['combat'];
  playerCoord: HexCoord;
}) {
  const [windowShown, setWindowShown] = useState(() =>
    createWindowVisibilityState(false),
  );

  useHexInfoWindowPromotion({
    combat,
    currentLootAvailable: false,
    playerCoord,
    currentStructure: undefined,
    suppressAutoOpen: false,
    setWindowShown,
    windowShown,
  });
  useCombatAttentionWindow({
    combat,
    hydrated: true,
    playerCoord,
    suppressHexInfoAutoOpen: false,
    setWindowVisibility: (windowKey, visible) =>
      setWindowShown((current) => ({ ...current, [windowKey]: visible })),
    windowShownHexInfo: windowShown.hexInfo,
  });

  return <div data-opened={windowShown.hexInfo ? 'true' : 'false'} />;
}

async function renderHarness(
  root: ReturnType<typeof createRoot>,
  props: Parameters<typeof Harness>[0],
) {
  await act(async () => {
    root.render(<Harness {...props} />);
  });
}
