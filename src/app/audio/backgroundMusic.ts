import type { GameState } from '../../game/state';
import type { Tile } from '../../game/types';

export type BackgroundMusicMood = 'ambient' | 'combat' | 'dungeon' | 'town';

export function resolveBackgroundMusicMood({
  combat,
  currentStructure,
}: {
  combat: GameState['combat'];
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
