import type { GameState, Tile } from '../../game/state';

export type MusicArea = 'ambient' | 'combat' | 'dungeon' | 'town';

export interface MusicTrack {
  area: MusicArea;
  id: string;
  label: string;
  src: string;
}

type ImportedAudioModule = {
  default: string;
};

const MUSIC_MODULES = import.meta.glob<ImportedAudioModule>(
  '../../assets/music/**/*.mp3',
  {
    eager: true,
  },
);

export const MUSIC_LIBRARY = Object.entries(MUSIC_MODULES)
  .map(([path, module]) => createTrack(path, module.default))
  .filter((track): track is MusicTrack => track !== null)
  .sort((left, right) => left.label.localeCompare(right.label));

export function getMusicTracks(area: MusicArea) {
  return MUSIC_LIBRARY.filter((track) => track.area === area);
}

export function resolveMusicArea({
  combat,
  currentTile,
}: {
  combat: GameState['combat'];
  currentTile: Tile;
}): MusicArea {
  if (combat) {
    return 'combat';
  }

  if (currentTile.structure === 'dungeon') {
    return 'dungeon';
  }

  if (
    currentTile.structure === 'town' ||
    currentTile.claim?.ownerType === 'faction'
  ) {
    return 'town';
  }

  return 'ambient';
}

export function shuffleTracks(
  tracks: readonly MusicTrack[],
  random = Math.random,
): MusicTrack[] {
  const shuffled = [...tracks];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [
      shuffled[nextIndex]!,
      shuffled[index]!,
    ];
  }

  return shuffled;
}

function createTrack(path: string, src: string): MusicTrack | null {
  const normalizedPath = path.replace(/\\/g, '/');
  const match = normalizedPath.match(/\/music\/(ambient|combat|dungeon|town)\/(.+)\.mp3$/);

  if (!match) {
    return null;
  }

  const [, area, fileName] = match;

  return {
    area: area as MusicArea,
    id: `${area}:${fileName}`,
    label: humanizeTrackLabel(fileName),
    src,
  };
}

function humanizeTrackLabel(fileName: string) {
  return fileName
    .split('-')
    .filter((segment) => Number.isNaN(Number(segment)))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
