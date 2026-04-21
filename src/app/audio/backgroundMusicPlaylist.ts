import { BACKGROUND_MUSIC_PLAYLISTS } from './backgroundMusicLibrary';
import type { BackgroundMusicMood } from './backgroundMusic';

export interface BackgroundMusicCycleEntry {
  lastTrack: string | null;
  remainingTracks: string[];
}

export type BackgroundMusicCycleState = Record<
  BackgroundMusicMood,
  BackgroundMusicCycleEntry
>;

export function createBackgroundMusicCycleState(): BackgroundMusicCycleState {
  return {
    ambient: { lastTrack: null, remainingTracks: [] },
    combat: { lastTrack: null, remainingTracks: [] },
    dungeon: { lastTrack: null, remainingTracks: [] },
    town: { lastTrack: null, remainingTracks: [] },
  };
}

export function getNextBackgroundMusicTrack(
  mood: BackgroundMusicMood,
  cycleState: BackgroundMusicCycleState,
  random = Math.random,
) {
  const playlist: readonly string[] = BACKGROUND_MUSIC_PLAYLISTS[mood];
  const cycle = cycleState[mood];
  const remainingTracks =
    cycle.remainingTracks.length > 0 ? cycle.remainingTracks : [...playlist];
  const availableTracks =
    cycle.lastTrack && remainingTracks.length > 1
      ? remainingTracks.filter((track) => track !== cycle.lastTrack)
      : remainingTracks;
  const nextTrack =
    availableTracks[Math.floor(random() * availableTracks.length)];

  cycle.lastTrack = nextTrack;
  cycle.remainingTracks = remainingTracks.filter(
    (track) => track !== nextTrack,
  );

  return nextTrack;
}
