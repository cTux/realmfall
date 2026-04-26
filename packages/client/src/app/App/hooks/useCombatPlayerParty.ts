import { useMemo } from 'react';
import type { GameState } from '../../../game/stateTypes';
import type { AppWindowsViewState } from '../AppWindows.types';

export function useCombatPlayerParty({
  combatSnapshot,
  heroOverview,
  mana,
}: {
  combatSnapshot: AppWindowsViewState['combat']['snapshot'];
  heroOverview: AppWindowsViewState['hero']['overview'];
  mana: GameState['player']['mana'];
}) {
  return useMemo(
    () =>
      combatSnapshot
        ? [
            {
              id: 'player',
              name: 'Player',
              level: heroOverview.level,
              hp: heroOverview.hp,
              maxHp: heroOverview.maxHp,
              mana,
              maxMana: heroOverview.maxMana,
              attack: heroOverview.attack,
              actor: combatSnapshot.combat.player,
              buffs: heroOverview.buffs.map(
                (id) =>
                  heroOverview.statusEffects.find(
                    (effect) => effect.id === id,
                  ) ?? {
                    id,
                  },
              ),
              debuffs: heroOverview.debuffs.map(
                (id) =>
                  heroOverview.statusEffects.find(
                    (effect) => effect.id === id,
                  ) ?? {
                    id,
                  },
              ),
            },
          ]
        : [],
    [
      combatSnapshot,
      heroOverview.attack,
      heroOverview.buffs,
      heroOverview.debuffs,
      heroOverview.hp,
      heroOverview.level,
      heroOverview.maxHp,
      heroOverview.maxMana,
      heroOverview.statusEffects,
      mana,
    ],
  );
}
