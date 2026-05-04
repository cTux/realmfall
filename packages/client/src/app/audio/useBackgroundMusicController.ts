import { Howl } from 'howler';
import { useEffect, useEffectEvent, useRef } from 'react';
import type { AudioSettings } from '../audioSettings';
import { type BackgroundMusicMood } from './backgroundMusic';
import {
  createBackgroundMusicCycleState,
  getNextBackgroundMusicTrack,
} from './backgroundMusicPlaylist';

const INITIAL_FADE_MS = 500;

interface BackgroundMusicPlayback {
  mood: BackgroundMusicMood;
  soundId: number;
  trackId: string;
  howl: Howl;
}

interface UseBackgroundMusicControllerOptions {
  audioSettings: AudioSettings;
  mood: BackgroundMusicMood;
}

function getTargetMusicVolume(settings: AudioSettings) {
  return settings.muted || settings.musicMuted ? 0 : settings.musicVolume;
}

function syncPlaybackSettings(
  playback: BackgroundMusicPlayback | null,
  settings: AudioSettings,
) {
  if (!playback) {
    return;
  }

  playback.howl.volume(settings.musicVolume, playback.soundId);
  playback.howl.mute(settings.muted || settings.musicMuted, playback.soundId);
}

function cleanupPlayback(playback: BackgroundMusicPlayback | null) {
  if (!playback) {
    return;
  }

  playback.howl.stop(playback.soundId);
  playback.howl.unload();
}

export function useBackgroundMusicController({
  audioSettings,
  mood,
}: UseBackgroundMusicControllerOptions) {
  const activatedRef = useRef(false);
  const cycleStateRef = useRef(createBackgroundMusicCycleState());
  const moodRef = useRef(mood);
  const settingsRef = useRef(audioSettings);
  const activePlaybackRef = useRef<BackgroundMusicPlayback | null>(null);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    settingsRef.current = audioSettings;
    syncPlaybackSettings(activePlaybackRef.current, audioSettings);
  }, [audioSettings]);

  const playMoodTrack = useEffectEvent(
    async (nextMood: BackgroundMusicMood) => {
      const nextTrack = getNextBackgroundMusicTrack(
        nextMood,
        cycleStateRef.current,
      );
      if (!nextTrack) {
        return;
      }

      const nextTrackUrl = await nextTrack.loadUrl();
      const howl = new Howl({
        html5: true,
        mute: false,
        src: [nextTrackUrl],
        volume: 0,
      });
      const soundId = howl.play();
      const playback: BackgroundMusicPlayback = {
        mood: nextMood,
        soundId,
        trackId: nextTrack.id,
        howl,
      };

      activePlaybackRef.current = playback;
      syncPlaybackSettings(playback, settingsRef.current);
      howl.fade(
        0,
        getTargetMusicVolume(settingsRef.current),
        INITIAL_FADE_MS,
        soundId,
      );
    },
  );

  const activatePlayback = useEffectEvent(() => {
    if (activatedRef.current) {
      return;
    }

    activatedRef.current = true;
    void playMoodTrack(moodRef.current);
  });

  useEffect(() => {
    document.addEventListener('pointerdown', activatePlayback, true);
    document.addEventListener('keydown', activatePlayback, true);

    return () => {
      document.removeEventListener('pointerdown', activatePlayback, true);
      document.removeEventListener('keydown', activatePlayback, true);
      cleanupPlayback(activePlaybackRef.current);
      activePlaybackRef.current = null;
    };
  }, []);
}
