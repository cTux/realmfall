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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockHandlersRef = useRef<(() => void) | null>(null);

  const currentTrack = playlist[currentTrackIndex] ?? null;
  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const syncProgress = () => {
      setCurrentTime(audio.currentTime);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleEnded = () => {
      setCurrentTime(0);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setCurrentTrackIndex((index) =>
        playlist.length === 0 ? 0 : (index + 1) % playlist.length,
      );
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('loadedmetadata', syncProgress);
    audio.addEventListener('timeupdate', syncProgress);
    audio.addEventListener('durationchange', syncProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      unlockHandlersRef.current?.();
      if (!isJsdomMediaEnvironment()) {
        audio.pause();
      }
      audio.src = '';
      audio.removeEventListener('loadedmetadata', syncProgress);
      audio.removeEventListener('timeupdate', syncProgress);
      audio.removeEventListener('durationchange', syncProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audioRef.current = null;
    };
  }, [playlist.length]);

  useEffect(() => {
    const nextPlaylist = shuffleTracks(getMusicTracks(area));
    setPlaylist(nextPlaylist);
    setCurrentTrackIndex(0);
  }, [area]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = audioSettings.muted;
    audio.volume = audioSettings.volume;
  }, [audioSettings.muted, audioSettings.volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!currentTrack) {
      if (!isJsdomMediaEnvironment()) {
        audio.pause();
      }
      audio.removeAttribute('src');
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    audio.src = currentTrack.src;
    audio.currentTime = AUDIO_RESET_TIME_SECONDS;
    setCurrentTime(0);
    setDuration(0);
    void attemptPlayback(audio, () => setIsPlaying(false), unlockHandlersRef);
  }, [currentTrack]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const intervalId = window.setInterval(() => {
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
        const audio = audioRef.current;
        if (!audio || !currentTrack) {
          return;
        }

        if (audio.paused) {
          void attemptPlayback(audio, () => setIsPlaying(false), unlockHandlersRef);
          return;
        }

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
        const audio = audioRef.current;
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
        const audio = audioRef.current;
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

async function attemptPlayback(
  audio: HTMLAudioElement,
  onBlocked: () => void,
  unlockHandlersRef: MutableRefObject<(() => void) | null>,
) {
  if (isJsdomMediaEnvironment()) {
    onBlocked();
    return;
  }

  try {
    await audio.play();
    unlockHandlersRef.current?.();
    unlockHandlersRef.current = null;
  } catch {
    onBlocked();
    if (typeof window === 'undefined') {
      return;
    }

    if (unlockHandlersRef.current) {
      return;
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
  }
}

function isJsdomMediaEnvironment() {
  return (
    typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  );
}
