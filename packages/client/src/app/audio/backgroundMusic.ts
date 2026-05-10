import type { CombatState, Tile } from '@realmfall/core/game/stateTypes';
import type { WorldKind } from '@realmfall/core/game/stateTypes';

export type BackgroundMusicMood = 'ambient' | 'combat' | 'dungeon' | 'town';

export function resolveBackgroundMusicMood({
  combat,
  currentWorldKind,
  currentStructure,
}: {
  combat: CombatState | null;
  currentWorldKind?: WorldKind;
  currentStructure: Tile['structure'];
}): BackgroundMusicMood {
  if (combat) {
    return 'combat';
  }

  if (currentWorldKind === 'dungeon') {
    return 'dungeon';
  }

  if (currentStructure === 'town') {
    return 'town';
  }

  return 'ambient';
}
