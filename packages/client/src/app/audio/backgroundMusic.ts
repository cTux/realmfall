import type { CombatState, Tile } from '../../game/stateTypes';
import type { WorldKind } from '../../game/stateTypes';

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
