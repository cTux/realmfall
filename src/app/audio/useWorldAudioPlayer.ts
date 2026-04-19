import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import type { AudioSettings } from '../audioSettings';
import {
  getMusicTracks,
  resolveMusicArea,
  shuffleTracks,
  type MusicArea,
  type MusicTrack,
} from './musicLibrary';

const PROGRESS_UPDATE_INTERVAL_MS = 250;
const AUDIO_RESET_TIME_SECONDS = 0;
const CROSSFADE_DURATION_MS = 900;
const VOLUME_EPSILON = 0.001;

export interface WorldAudioPlayerView {
  currentTime: number;
  currentTrack: MusicTrack | null;
  currentTrackIndex: number;
  duration: number;
  isPlaying: boolean;
  playlist: MusicTrack[];
  progress: number;
  title: string;
  area: MusicArea;
  canPlay: boolean;
}

export function useWorldAudioPlayer({
  audioSettings,
  combat,
  currentTile,
}: {
  audioSettings: AudioSettings;
  combat: import('../../game/state').GameState['combat'];
  currentTile: import('../../game/state').Tile;
}) {
  const area = useMemo(
    () => resolveMusicArea({ combat, currentTile }),
    [combat, currentTile],
  );
  const [playlist, setPlaylist] = useState<MusicTrack[]>(() =>
    shuffleTracks(getMusicTracks(area)),
  );
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioDecksRef = useRef<[HTMLAudioElement | null, HTMLAudioElement | null]>([
    null,
    null,
  ]);
  const activeDeckIndexRef = useRef(0);
  const crossfadeCleanupRef = useRef<(() => void) | null>(null);
  const unlockHandlersRef = useRef<(() => void) | null>(null);
  const playbackIntentRef = useRef(true);

  const currentTrack = playlist[currentTrackIndex] ?? null;
  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  useEffect(() => {
    const audioDecks = [createAudioDeck(), createAudioDeck()] as const;
    audioDecksRef.current = [...audioDecks];
    activeDeckIndexRef.current = 0;

    const removeListeners = audioDecks.map((audio, index) =>
      bindAudioDeckEvents({
        audio,
        getIsActive: () => index === activeDeckIndexRef.current,
        onEnded: () => {
          setCurrentTime(0);
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
          setCurrentTrackIndex((deckIndex) =>
            playlist.length === 0 ? 0 : (deckIndex + 1) % playlist.length,
          );
        },
        onPause: () => {
          setIsPlaying(false);
        },
        onPlay: () => {
          setIsPlaying(true);
        },
        onSyncProgress: () => {
          setCurrentTime(audio.currentTime);
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        },
      }),
    );

    const cleanupUnlockHandlers = unlockHandlersRef.current;

    return () => {
      crossfadeCleanupRef.current?.();
      crossfadeCleanupRef.current = null;
      cleanupUnlockHandlers?.();
      removeListeners.forEach((remove) => remove());
      audioDecks.forEach((audio) => resetAudioDeck(audio));
      audioDecksRef.current = [null, null];
    };
  }, [playlist.length]);

  useEffect(() => {
    const nextPlaylist = shuffleTracks(getMusicTracks(area));
    setPlaylist(nextPlaylist);
    setCurrentTrackIndex(0);
  }, [area]);

  useEffect(() => {
    audioDecksRef.current.forEach((audio, index) => {
      if (!audio) {
        return;
      }

      audio.muted = audioSettings.muted;
      if (index === activeDeckIndexRef.current) {
        audio.volume = audio.paused ? audio.volume : audioSettings.volume;
      }
    });
  }, [audioSettings.muted, audioSettings.volume]);

  useEffect(() => {
    if (!currentTrack) {
      crossfadeCleanupRef.current?.();
      audioDecksRef.current.forEach((audio) => {
        if (!audio) {
          return;
        }
        resetAudioDeck(audio);
      });
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    const activeAudio = getActiveAudioDeck(audioDecksRef, activeDeckIndexRef);
    const nextDeckIndex = activeDeckIndexRef.current === 0 ? 1 : 0;
    const nextAudio = audioDecksRef.current[nextDeckIndex];

    if (!nextAudio) {
      return;
    }

    crossfadeCleanupRef.current?.();

    const shouldPlay = playbackIntentRef.current;
    const shouldCrossfade =
      shouldPlay &&
      activeAudio != null &&
      activeAudio.src.length > 0 &&
      !activeAudio.paused &&
      activeAudio.src !== currentTrack.src;

    nextAudio.src = currentTrack.src;
    nextAudio.currentTime = AUDIO_RESET_TIME_SECONDS;
    nextAudio.muted = audioSettings.muted;
    nextAudio.volume = shouldCrossfade ? 0 : audioSettings.volume;
    if (!isJsdomMediaEnvironment()) {
      nextAudio.load();
    }

    setCurrentTime(0);
    setDuration(0);

    if (!shouldPlay) {
      activeDeckIndexRef.current = nextDeckIndex;
      setIsPlaying(false);
      return;
    }

    if (!shouldCrossfade) {
      if (activeAudio && !isJsdomMediaEnvironment()) {
        activeAudio.pause();
      }
      activeDeckIndexRef.current = nextDeckIndex;
      void attemptPlayback(nextAudio, () => setIsPlaying(false), unlockHandlersRef);
      return;
    }

    void attemptPlayback(nextAudio, () => setIsPlaying(false), unlockHandlersRef).then(
      () => {
        activeDeckIndexRef.current = nextDeckIndex;
        crossfadeCleanupRef.current = fadeBetweenTracks({
          fromAudio: activeAudio,
          toAudio: nextAudio,
          targetVolume: audioSettings.volume,
        });
      },
    );
  }, [currentTrack]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const intervalId = window.setInterval(() => {
      const audio = getActiveAudioDeck(audioDecksRef, activeDeckIndexRef);
      if (!audio) {
        return;
      }

      if (audio.paused) {
        return;
      }

      setCurrentTime(audio.currentTime);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    }, PROGRESS_UPDATE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return {
    view: {
      area,
      canPlay: playlist.length > 0,
      currentTime,
      currentTrack,
      currentTrackIndex,
      duration,
      isPlaying,
      playlist,
      progress,
      title: currentTrack?.label ?? '',
    } satisfies WorldAudioPlayerView,
    actions: {
      playPause: () => {
        const audio = getActiveAudioDeck(audioDecksRef, activeDeckIndexRef);
        if (!audio || !currentTrack) {
          return;
        }

        if (audio.paused) {
          playbackIntentRef.current = true;
          void attemptPlayback(audio, () => setIsPlaying(false), unlockHandlersRef);
          return;
        }

        playbackIntentRef.current = false;
        if (!isJsdomMediaEnvironment()) {
          audio.pause();
        }
        setIsPlaying(false);
      },
      nextTrack: () => {
        if (playlist.length === 0) {
          return;
        }

        setCurrentTrackIndex((index) => (index + 1) % playlist.length);
      },
      previousTrack: () => {
        const audio = getActiveAudioDeck(audioDecksRef, activeDeckIndexRef);
        if (!audio || playlist.length === 0) {
          return;
        }

        if (audio.currentTime > 3) {
          audio.currentTime = AUDIO_RESET_TIME_SECONDS;
          setCurrentTime(0);
          return;
        }

        setCurrentTrackIndex(
          (index) => (index - 1 + playlist.length) % playlist.length,
        );
      },
      seek: (progressValue: number) => {
        const audio = getActiveAudioDeck(audioDecksRef, activeDeckIndexRef);
        if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
          return;
        }

        const nextProgress = Math.min(1, Math.max(0, progressValue));
        audio.currentTime = audio.duration * nextProgress;
        setCurrentTime(audio.currentTime);
      },
    },
  };
}

function createAudioDeck() {
  const audio = new Audio();
  audio.preload = 'metadata';
  return audio;
}

function bindAudioDeckEvents({
  audio,
  getIsActive,
  onEnded,
  onPause,
  onPlay,
  onSyncProgress,
}: {
  audio: HTMLAudioElement;
  getIsActive: () => boolean;
  onEnded: () => void;
  onPause: () => void;
  onPlay: () => void;
  onSyncProgress: () => void;
}) {
  const syncProgress = () => {
    if (getIsActive()) {
      onSyncProgress();
    }
  };
  const handleEnded = () => {
    if (getIsActive()) {
      onEnded();
    }
  };
  const handlePause = () => {
    if (getIsActive()) {
      onPause();
    }
  };
  const handlePlay = () => {
    if (getIsActive()) {
      onPlay();
    }
  };

  audio.addEventListener('loadedmetadata', syncProgress);
  audio.addEventListener('timeupdate', syncProgress);
  audio.addEventListener('durationchange', syncProgress);
  audio.addEventListener('ended', handleEnded);
  audio.addEventListener('pause', handlePause);
  audio.addEventListener('play', handlePlay);

  return () => {
    audio.removeEventListener('loadedmetadata', syncProgress);
    audio.removeEventListener('timeupdate', syncProgress);
    audio.removeEventListener('durationchange', syncProgress);
    audio.removeEventListener('ended', handleEnded);
    audio.removeEventListener('pause', handlePause);
    audio.removeEventListener('play', handlePlay);
  };
}

function getActiveAudioDeck(
  audioDecksRef: MutableRefObject<[HTMLAudioElement | null, HTMLAudioElement | null]>,
  activeDeckIndexRef: MutableRefObject<number>,
) {
  return audioDecksRef.current[activeDeckIndexRef.current];
}

function fadeBetweenTracks({
  fromAudio,
  toAudio,
  targetVolume,
}: {
  fromAudio: HTMLAudioElement;
  toAudio: HTMLAudioElement;
  targetVolume: number;
}) {
  if (typeof window === 'undefined' || isJsdomMediaEnvironment()) {
    if (!isJsdomMediaEnvironment()) {
      fromAudio.pause();
    }
    fromAudio.currentTime = AUDIO_RESET_TIME_SECONDS;
    fromAudio.volume = 0;
    toAudio.volume = targetVolume;
    return null;
  }

  const startedAt = performance.now();
  let animationFrameId = 0;

  const tick = (now: number) => {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / CROSSFADE_DURATION_MS);
    fromAudio.volume = Math.max(0, targetVolume * (1 - progress));
    toAudio.volume = Math.min(targetVolume, targetVolume * progress);

    if (progress >= 1 - VOLUME_EPSILON) {
      if (!isJsdomMediaEnvironment()) {
        fromAudio.pause();
      }
      fromAudio.currentTime = AUDIO_RESET_TIME_SECONDS;
      fromAudio.volume = 0;
      toAudio.volume = targetVolume;
      return;
    }

    animationFrameId = window.requestAnimationFrame(tick);
  };

  animationFrameId = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(animationFrameId);
    if (!isJsdomMediaEnvironment()) {
      fromAudio.pause();
    }
    fromAudio.currentTime = AUDIO_RESET_TIME_SECONDS;
    fromAudio.volume = 0;
    toAudio.volume = targetVolume;
  };
}

function resetAudioDeck(audio: HTMLAudioElement) {
  if (!isJsdomMediaEnvironment()) {
    audio.pause();
  }
  audio.src = '';
  audio.removeAttribute('src');
  audio.currentTime = AUDIO_RESET_TIME_SECONDS;
  audio.volume = 0;
  if (!isJsdomMediaEnvironment()) {
    audio.load();
  }
}

async function attemptPlayback(
  audio: HTMLAudioElement,
  onBlocked: () => void,
  unlockHandlersRef: MutableRefObject<(() => void) | null>,
) {
  if (isJsdomMediaEnvironment()) {
    setPlaybackStateForJsdom(audio);
    return true;
  }

  try {
    await audio.play();
    unlockHandlersRef.current?.();
    unlockHandlersRef.current = null;
    return true;
  } catch {
    onBlocked();
    if (typeof window === 'undefined') {
      return false;
    }

    if (unlockHandlersRef.current) {
      return false;
    }

    const retry = () => {
      void audio
        .play()
        .then(() => {
          cleanup();
        })
        .catch(() => {
          onBlocked();
        });
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', retry);
      window.removeEventListener('keydown', retry);
      unlockHandlersRef.current = null;
    };

    unlockHandlersRef.current = cleanup;
    window.addEventListener('pointerdown', retry, { once: true });
    window.addEventListener('keydown', retry, { once: true });
    return false;
  }
}

function setPlaybackStateForJsdom(audio: HTMLAudioElement) {
  Object.defineProperty(audio, 'paused', {
    configurable: true,
    value: false,
  });
}

function isJsdomMediaEnvironment() {
  return (
    typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  );
}
