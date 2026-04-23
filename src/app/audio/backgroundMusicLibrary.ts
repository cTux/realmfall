import type { BackgroundMusicMood } from './backgroundMusic';

export interface BackgroundMusicTrack {
  id: string;
  loadUrl: () => Promise<string>;
}

const backgroundMusicModules = import.meta.glob('../../assets/music/**/*.mp3', {
  import: 'default',
}) as Record<string, () => Promise<string>>;

export const BACKGROUND_MUSIC_PLAYLISTS = buildBackgroundMusicPlaylists(
  backgroundMusicModules,
);

function buildBackgroundMusicPlaylists(
  modules: Record<string, () => Promise<string>>,
) {
  const playlists: Record<BackgroundMusicMood, BackgroundMusicTrack[]> = {
    ambient: [],
    combat: [],
    dungeon: [],
    town: [],
  };

  Object.entries(modules).forEach(([path, loadUrl]) => {
    const normalizedPath = path.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const mood = parts[parts.length - 2];

    if (!isBackgroundMusicMood(mood)) {
      return;
    }

    playlists[mood].push({
      id: normalizedPath,
      loadUrl,
    });
  });

  (Object.keys(playlists) as BackgroundMusicMood[]).forEach((mood) => {
    playlists[mood].sort((left, right) => left.id.localeCompare(right.id));
  });

  return playlists;
}

function isBackgroundMusicMood(value: string | undefined) {
  return (
    value === 'ambient' ||
    value === 'combat' ||
    value === 'dungeon' ||
    value === 'town'
  );
}
