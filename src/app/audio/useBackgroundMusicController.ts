import { useEffect, useEffectEvent, useRef } from 'react';
import { useAudioPlayer } from 'react-use-audio-player';
import type { AudioSettings } from '../audioSettings';
import { type BackgroundMusicMood } from './backgroundMusic';
import { BACKGROUND_MUSIC_PLAYLISTS } from './backgroundMusicLibrary';
import {
  createBackgroundMusicCycleState,
  getNextBackgroundMusicTrack,
} from './backgroundMusicPlaylist';

interface UseBackgroundMusicControllerOptions {
  audioSettings: AudioSettings;
  mood: BackgroundMusicMood;
}

export function useBackgroundMusicController({
  audioSettings,
  mood,
}: UseBackgroundMusicControllerOptions) {
  const { load, mute, setVolume, unmute } = useAudioPlayer();
  const activatedRef = useRef(false);
  const cycleStateRef = useRef(createBackgroundMusicCycleState());
  const moodRef = useRef(mood);
  const activeTrackRef = useRef<{
    mood: BackgroundMusicMood;
    src: string;
  } | null>(null);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const applyAudioSettings = useEffectEvent((nextSettings: AudioSettings) => {
    setVolume(nextSettings.musicVolume);
    if (nextSettings.muted || nextSettings.musicMuted) {
      mute();
      return;
    }

    unmute();
  });

  const playNextTrack = useEffectEvent(
    async (nextMood: BackgroundMusicMood, attemptedLoads = 0) => {
      const retryLimit = BACKGROUND_MUSIC_PLAYLISTS[nextMood].length + 1;
      const nextTrack = getNextBackgroundMusicTrack(
        nextMood,
        cycleStateRef.current,
      );
      if (!nextTrack) {
        return;
      }

      try {
        const nextTrackUrl = await nextTrack.loadUrl();
        activeTrackRef.current = { mood: nextMood, src: nextTrackUrl };
        load(nextTrackUrl, {
          autoplay: true,
          html5: true,
          initialMute: audioSettings.muted || audioSettings.musicMuted,
          initialVolume: audioSettings.musicVolume,
          onend: () => {
            void playNextTrack(moodRef.current);
          },
        });
      } catch (_error) {
        if (attemptedLoads < retryLimit) {
          void playNextTrack(nextMood, attemptedLoads + 1);
        }
      }
    },
  );
    const nextTrack = getNextBackgroundMusicTrack(
      nextMood,
      cycleStateRef.current,
    );
    if (!nextTrack) {
      return;
    }

    void nextTrack.loadUrl().then((nextTrackUrl) => {
      activeTrackRef.current = { mood: nextMood, src: nextTrackUrl };
      load(nextTrackUrl, {
        autoplay: true,
        html5: true,
        initialMute: audioSettings.muted || audioSettings.musicMuted,
        initialVolume: audioSettings.musicVolume,
        onend: () => {
          playNextTrack(moodRef.current);
        },
      });
    });
  });

  const activatePlayback = useEffectEvent(() => {
    if (activatedRef.current) {
      return;
    }

    activatedRef.current = true;
    playNextTrack(moodRef.current);
  });

  useEffect(() => {
    document.addEventListener('pointerdown', activatePlayback, true);
    document.addEventListener('keydown', activatePlayback, true);

    return () => {
      document.removeEventListener('pointerdown', activatePlayback, true);
      document.removeEventListener('keydown', activatePlayback, true);
    };
  }, []);

  useEffect(() => {
    applyAudioSettings(audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    if (!activatedRef.current) {
      return;
    }

    if (activeTrackRef.current?.mood === mood) {
      return;
    }

    playNextTrack(mood);
  }, [mood]);
}
