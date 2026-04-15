import { useMemo } from 'react';
import { describeStructure, getHostileEnemyIds } from '../../../game/state';
import type { AppWindowsProps } from '../AppWindows.types';
import { formatTerrainLabel } from '../utils/formatTerrainLabel';

export function useHexInfoView({
  game,
  currentTile,
  combatSnapshot,
}: Pick<AppWindowsProps, 'game' | 'currentTile' | 'combatSnapshot'>) {
  return useMemo(
    () => ({
      isHome:
        game.homeHex.q === game.player.coord.q &&
        game.homeHex.r === game.player.coord.r,
      canSetHome:
        !currentTile.claim || currentTile.claim.ownerType === 'player',
      terrain: formatTerrainLabel(currentTile.terrain),
      structure: currentTile.structure
        ? describeStructure(currentTile.structure)
        : null,
      enemyCount: game.combat
        ? (combatSnapshot?.enemies.length ?? 0)
        : getHostileEnemyIds(game, currentTile.coord).length,
    }),
    [combatSnapshot?.enemies.length, currentTile, game],
  );
}
