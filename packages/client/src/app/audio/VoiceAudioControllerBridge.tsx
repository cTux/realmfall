import { useEffect, useRef } from 'react';
import type { AudioSettings } from '../audioSettings';
import {
  VOICE_PLAYBACK_EVENT_OPTIONS,
  detectVoicePlaybackEvent,
  type VoicePlaybackEventState,
} from './voiceEvents';
import { pickVoiceClipUrl, type VoiceClipCategory } from './voiceLibrary';

const ACTIVATION_EVENTS = ['keydown', 'mousedown', 'pointerdown', 'touchstart'];
const MIN_PLAYBACK_INTERVAL_MS = 700;

interface VoiceAudioControllerBridgeProps {
  audioSettings: AudioSettings;
  voicePlaybackState: VoicePlaybackEventState;
}

export function VoiceAudioControllerBridge({
  audioSettings,
  voicePlaybackState,
}: VoiceAudioControllerBridgeProps) {
  const { muted, respectReducedMotion, voiceVolume } = audioSettings;
  const activatedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousVoicePlaybackStateRef = useRef(voicePlaybackState);
  const playbackRequestIdRef = useRef(0);
  const previousClipIndexRef = useRef<
    Partial<Record<VoiceClipCategory, number>>
  >({});
  const lastPlaybackRef = useRef<{
    eventKey: keyof AudioSettings['voice']['events'] | null;
    timestamp: number;
  }>({
    eventKey: null,
    timestamp: 0,
  });

  useEffect(() => {
    const activate = () => {
      activatedRef.current = true;
    };

    ACTIVATION_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, activate, { passive: true });
    });

    return () => {
      ACTIVATION_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, activate);
      });
    };
  }, []);

  useEffect(
    () => () => {
      stopAudio(currentAudioRef.current);
      currentAudioRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!respectReducedMotion) {
      return;
    }

    const reducedMotionQuery = getReducedMotionMediaQuery(window);
    if (!reducedMotionQuery) {
      return;
    }

    const handleReducedMotionChange = () => {
      if (reducedMotionQuery.matches) {
        stopAudio(currentAudioRef.current);
        currentAudioRef.current = null;
      }
    };

    addMediaQueryListener(reducedMotionQuery, handleReducedMotionChange);

    return () => {
      removeMediaQueryListener(reducedMotionQuery, handleReducedMotionChange);
    };
  }, [respectReducedMotion]);

  useEffect(() => {
    if (muted || (respectReducedMotion && prefersReducedMotion(window))) {
      playbackRequestIdRef.current += 1;
      stopAudio(currentAudioRef.current);
      currentAudioRef.current = null;
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.volume = voiceVolume;
    }
  }, [muted, respectReducedMotion, voiceVolume]);

  useEffect(() => {
    const previousVoicePlaybackState = previousVoicePlaybackStateRef.current;
    previousVoicePlaybackStateRef.current = voicePlaybackState;

    const playbackEventKey = detectVoicePlaybackEvent(
      previousVoicePlaybackState,
      voicePlaybackState,
    );
    if (!playbackEventKey || !audioSettings.voice.events[playbackEventKey]) {
      return;
    }

    if (!activatedRef.current) {
      return;
    }

    if (muted || (respectReducedMotion && prefersReducedMotion(window))) {
      return;
    }

    const now = performance.now();
    if (now - lastPlaybackRef.current.timestamp < MIN_PLAYBACK_INTERVAL_MS) {
      return;
    }

    const definition = VOICE_PLAYBACK_EVENT_OPTIONS.find(
      (option) => option.key === playbackEventKey,
    );
    if (!definition) {
      return;
    }

    const playbackRequestId = playbackRequestIdRef.current + 1;
    playbackRequestIdRef.current = playbackRequestId;

    void pickVoiceClipUrl(
      audioSettings.voice.actorId,
      definition.audioCategory,
      previousClipIndexRef.current,
    ).then((clipUrl) => {
      if (playbackRequestIdRef.current !== playbackRequestId) {
        return;
      }

      if (!clipUrl) {
        return;
      }

      if (muted || (respectReducedMotion && prefersReducedMotion(window))) {
        return;
      }

      stopAudio(currentAudioRef.current);
      currentAudioRef.current = null;

      const audio = new Audio(clipUrl);
      audio.preload = 'auto';
      audio.volume = voiceVolume;
      currentAudioRef.current = audio;
      lastPlaybackRef.current = {
        eventKey: playbackEventKey,
        timestamp: now,
      };

      attemptPlayback(audio, () => {
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      });
    });
  }, [
    audioSettings,
    muted,
    respectReducedMotion,
    voicePlaybackState,
    voiceVolume,
  ]);

  return null;
}

function prefersReducedMotion(target: Window) {
  return getReducedMotionMediaQuery(target)?.matches ?? false;
}

function getReducedMotionMediaQuery(target: Window) {
  return typeof target.matchMedia === 'function'
    ? target.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
}

function addMediaQueryListener(
  mediaQuery: MediaQueryList,
  listener: () => void,
) {
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return;
  }

  if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(listener);
  }
}

function removeMediaQueryListener(
  mediaQuery: MediaQueryList,
  listener: () => void,
) {
  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', listener);
    return;
  }

  if (typeof mediaQuery.removeListener === 'function') {
    mediaQuery.removeListener(listener);
  }
}

function stopAudio(audio: HTMLAudioElement | null) {
  if (!audio || typeof audio.pause !== 'function') {
    return;
  }

  try {
    audio.pause();
  } catch {
    // jsdom does not implement HTMLMediaElement playback methods.
  }
}

function attemptPlayback(audio: HTMLAudioElement, onFailure: () => void) {
  try {
    const playback = audio.play();

    if (
      playback &&
      typeof playback === 'object' &&
      'catch' in playback &&
      typeof playback.catch === 'function'
    ) {
      void playback.catch(onFailure);
    }
  } catch {
    onFailure();
  }
}
