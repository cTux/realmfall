import { useMemo } from 'react';
import type { GameState } from '../../../game/state';
import type { AppWindowsViewState } from '../AppWindows.types';

export function useCombatPlayerParty({
  combatSnapshot,
  stats,
  mana,
}: {
  combatSnapshot: AppWindowsViewState['combat']['snapshot'];
  stats: AppWindowsViewState['hero']['stats'];
  mana: GameState['player']['mana'];
}) {
  return useMemo(
    () =>
      combatSnapshot
        ? [
            {
              id: 'player',
              name: 'Player',
              level: stats.level,
              hp: stats.hp,
              maxHp: stats.maxHp,
              mana,
              maxMana: stats.maxMana,
              actor: combatSnapshot.combat.player,
            },
          ]
        : [],
    [combatSnapshot, mana, stats.hp, stats.level, stats.maxHp, stats.maxMana],
  );
}
