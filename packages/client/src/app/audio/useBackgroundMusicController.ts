import { Howl } from 'howler';
import { useEffect, useEffectEvent, useRef } from 'react';
import type { AudioSettings } from '../audioSettings';
import { type BackgroundMusicMood } from './backgroundMusic';
import { BACKGROUND_MUSIC_PLAYLISTS } from './backgroundMusicLibrary';
import {
  createBackgroundMusicCycleState,
  getNextBackgroundMusicTrack,
} from './backgroundMusicPlaylist';

const INITIAL_FADE_MS = 500;
const TRACK_ADVANCE_FADE_MS = 500;
const CROSSFADE_MS = 1000;

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

  playback.howl.off('end');
  playback.howl.off('fade');
  playback.howl.off('loaderror');
  playback.howl.off('playerror');
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
  const transitionTokenRef = useRef(0);
  const currentPlaybackRef = useRef<BackgroundMusicPlayback | null>(null);
  const outgoingPlaybackRef = useRef<BackgroundMusicPlayback | null>(null);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    settingsRef.current = audioSettings;
    syncPlaybackSettings(currentPlaybackRef.current, audioSettings);
    syncPlaybackSettings(outgoingPlaybackRef.current, audioSettings);
  }, [audioSettings]);

  const startPlayback = useEffectEvent(
    async (
      nextMood: BackgroundMusicMood,
      {
        attempt = 0,
        fadeDurationMs = INITIAL_FADE_MS,
        replaceCurrent = false,
        token = transitionTokenRef.current,
      }: {
        attempt?: number;
        fadeDurationMs?: number;
        replaceCurrent?: boolean;
        token?: number;
      } = {},
    ) => {
      const retryLimit = BACKGROUND_MUSIC_PLAYLISTS[nextMood].length;
      const nextTrack = getNextBackgroundMusicTrack(
        nextMood,
        cycleStateRef.current,
      );
      if (!nextTrack) {
        return;
      }

      try {
        const nextTrackUrl = await nextTrack.loadUrl();
        if (token !== transitionTokenRef.current) {
          return;
        }

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

        howl.once('end', () => {
          if (currentPlaybackRef.current?.trackId !== playback.trackId) {
            return;
          }

          cleanupPlayback(playback);
          currentPlaybackRef.current = null;
          void startPlayback(moodRef.current, {
            fadeDurationMs: TRACK_ADVANCE_FADE_MS,
            replaceCurrent: false,
            token: transitionTokenRef.current,
          });
        });

        if (replaceCurrent) {
          cleanupPlayback(outgoingPlaybackRef.current);
          outgoingPlaybackRef.current = currentPlaybackRef.current;
          currentPlaybackRef.current = playback;

          syncPlaybackSettings(playback, settingsRef.current);
          playback.howl.fade(
            0,
            getTargetMusicVolume(settingsRef.current),
            fadeDurationMs,
            soundId,
          );

          const outgoing = outgoingPlaybackRef.current;
          if (outgoing) {
            outgoing.howl.once('fade', () => {
              cleanupPlayback(outgoing);
              if (outgoingPlaybackRef.current?.trackId === outgoing.trackId) {
                outgoingPlaybackRef.current = null;
              }
            });
            outgoing.howl.fade(
              getTargetMusicVolume(settingsRef.current),
              0,
              fadeDurationMs,
              outgoing.soundId,
            );
          }

          return;
        }

        currentPlaybackRef.current = playback;
        syncPlaybackSettings(playback, settingsRef.current);
        playback.howl.fade(
          0,
          getTargetMusicVolume(settingsRef.current),
          fadeDurationMs,
          soundId,
        );
      } catch {
        if (attempt + 1 < retryLimit) {
          await startPlayback(nextMood, {
            attempt: attempt + 1,
            fadeDurationMs,
            replaceCurrent,
            token,
          });
          return;
        }

        if (replaceCurrent) {
          cleanupPlayback(currentPlaybackRef.current);
          currentPlaybackRef.current = null;
        }
      }
    },
  );

  const activatePlayback = useEffectEvent(() => {
    if (activatedRef.current) {
      return;
    }

    activatedRef.current = true;
    transitionTokenRef.current += 1;
    void startPlayback(moodRef.current, {
      fadeDurationMs: INITIAL_FADE_MS,
      replaceCurrent: false,
      token: transitionTokenRef.current,
    });
  });

  useEffect(() => {
    document.addEventListener('pointerdown', activatePlayback, true);
    document.addEventListener('keydown', activatePlayback, true);

    return () => {
      document.removeEventListener('pointerdown', activatePlayback, true);
      document.removeEventListener('keydown', activatePlayback, true);
      cleanupPlayback(currentPlaybackRef.current);
      cleanupPlayback(outgoingPlaybackRef.current);
      currentPlaybackRef.current = null;
      outgoingPlaybackRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!activatedRef.current) {
      return;
    }

    if (currentPlaybackRef.current?.mood === mood) {
      return;
    }

    transitionTokenRef.current += 1;
    void startPlayback(mood, {
      fadeDurationMs: CROSSFADE_MS,
      replaceCurrent: true,
      token: transitionTokenRef.current,
    });
  }, [mood]);
}
