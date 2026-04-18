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
              buffs: stats.buffs,
              debuffs: stats.debuffs,
            },
          ]
        : [],
    [
      combatSnapshot,
      mana,
      stats.buffs,
      stats.debuffs,
      stats.hp,
      stats.level,
      stats.maxHp,
      stats.maxMana,
    ],
  );
}
