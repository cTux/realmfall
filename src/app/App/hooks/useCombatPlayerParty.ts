import { useMemo } from 'react';
import type { GameState } from '../../../game/stateTypes';
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
              attack: stats.attack,
              actor: combatSnapshot.combat.player,
              buffs: stats.buffs.map(
                (id) =>
                  stats.statusEffects.find((effect) => effect.id === id) ?? {
                    id,
                  },
              ),
              debuffs: stats.debuffs.map(
                (id) =>
                  stats.statusEffects.find((effect) => effect.id === id) ?? {
                    id,
                  },
              ),
            },
          ]
        : [],
    [
      combatSnapshot,
      mana,
      stats.buffs,
      stats.debuffs,
      stats.statusEffects,
      stats.attack,
      stats.hp,
      stats.level,
      stats.maxHp,
      stats.maxMana,
    ],
  );
}
