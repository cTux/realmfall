import { useMemo } from 'react';
import { describeStructure } from '../../../game/state';
import type { AppWindowsViewState } from '../AppWindows.types';
import { formatTerrainLabel } from '../utils/formatTerrainLabel';

export function useHexInfoView({
  homeHex,
  playerCoord,
  currentTile,
  currentTileHostileEnemyCount,
  combat,
  combatSnapshot,
}: {
  homeHex: AppWindowsViewState['world']['homeHex'];
  playerCoord: AppWindowsViewState['player']['coord'];
  currentTile: AppWindowsViewState['world']['currentTile'];
  currentTileHostileEnemyCount: AppWindowsViewState['world']['currentTileHostileEnemyCount'];
  combat: AppWindowsViewState['world']['combat'];
  combatSnapshot: AppWindowsViewState['combat']['snapshot'];
}) {
  return useMemo(
    () => ({
      isHome: homeHex.q === playerCoord.q && homeHex.r === playerCoord.r,
      canSetHome:
        !currentTile.claim || currentTile.claim.ownerType === 'player',
      terrain: formatTerrainLabel(currentTile.terrain),
      structure: currentTile.structure
        ? describeStructure(currentTile.structure)
        : null,
      enemyCount: combat
        ? (combatSnapshot?.enemies.length ?? 0)
        : currentTileHostileEnemyCount,
    }),
    [
      combat,
      combatSnapshot?.enemies.length,
      currentTile,
      currentTileHostileEnemyCount,
      homeHex,
      playerCoord,
    ],
  );
}
