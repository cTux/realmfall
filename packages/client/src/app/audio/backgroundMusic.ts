import type { CombatState, Tile } from '../../game/stateTypes';

export type BackgroundMusicMood = 'ambient' | 'combat' | 'dungeon' | 'town';

export function resolveBackgroundMusicMood({
  combat,
  currentStructure,
}: {
  combat: CombatState | null;
  currentStructure: Tile['structure'];
}): BackgroundMusicMood {
  if (combat) {
    return 'combat';
  }

  if (currentStructure === 'dungeon') {
    return 'dungeon';
  }

  if (currentStructure === 'town') {
    return 'town';
  }

  return 'ambient';
}
