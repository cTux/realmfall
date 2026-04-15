import { useMemo } from 'react';
import type { GameState } from '../../../game/state';
import type { AppWindowsProps } from '../AppWindows.types';

export function useCombatPlayerParty({
  combatSnapshot,
  stats,
  mana,
}: {
  combatSnapshot: AppWindowsProps['combatSnapshot'];
  stats: AppWindowsProps['stats'];
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
