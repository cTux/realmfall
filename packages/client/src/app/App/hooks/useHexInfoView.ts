import { useMemo } from 'react';
import {
  describeStructure,
  describeStructureDescription,
} from '../../../game/world';
import type { AppWindowsViewState } from '../AppWindows.types';
import {
  formatTerrainDescription,
  formatTerrainLabel,
} from '../utils/formatTerrainLabel';

export function useHexInfoView({
  homeHex,
  playerCoord,
  currentTile,
  currentTileHostileEnemyCount,
  combat,
  combatSnapshot,
}: {
  homeHex: AppWindowsViewState['hex']['homeHex'];
  playerCoord: AppWindowsViewState['player']['coord'];
  currentTile: AppWindowsViewState['hex']['currentTile'];
  currentTileHostileEnemyCount: AppWindowsViewState['hex']['currentTileHostileEnemyCount'];
  combat: AppWindowsViewState['hex']['combat'];
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
      hexDescription:
        describeStructureDescription(currentTile.structure) ??
        formatTerrainDescription(currentTile.terrain),
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
