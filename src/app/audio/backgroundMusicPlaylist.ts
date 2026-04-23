import {
  BACKGROUND_MUSIC_PLAYLISTS,
  type BackgroundMusicTrack,
} from './backgroundMusicLibrary';
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
  const playlist: readonly BackgroundMusicTrack[] =
    BACKGROUND_MUSIC_PLAYLISTS[mood];
  const cycle = cycleState[mood];
  const remainingTracks =
    cycle.remainingTracks.length > 0
      ? cycle.remainingTracks
      : playlist.map((track) => track.id);
  const availableTracks =
    cycle.lastTrack && remainingTracks.length > 1
      ? remainingTracks.filter((trackId) => trackId !== cycle.lastTrack)
      : remainingTracks;
  const nextTrackId =
    availableTracks[Math.floor(random() * availableTracks.length)];
  const nextTrack = playlist.find((track) => track.id === nextTrackId);

  if (!nextTrack) {
    return null;
  }

  cycle.lastTrack = nextTrack.id;
  cycle.remainingTracks = remainingTracks.filter(
    (trackId) => trackId !== nextTrack.id,
  );

  return nextTrack;
}
