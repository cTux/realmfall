import { useEffect, useRef } from 'react';
import type { GameState } from '../../game/state';
import type { AudioSettings } from '../audioSettings';
import {
  VOICE_PLAYBACK_EVENT_OPTIONS,
  detectVoicePlaybackEvent,
} from './voiceEvents';
import {
  getVoiceClipUrls,
  type VoiceActorId,
  type VoiceClipCategory,
} from './voiceLibrary';

const ACTIVATION_EVENTS = ['keydown', 'mousedown', 'pointerdown', 'touchstart'];
const MIN_PLAYBACK_INTERVAL_MS = 700;

interface VoiceAudioControllerBridgeProps {
  audioSettings: AudioSettings;
  game: GameState;
}

export function VoiceAudioControllerBridge({
  audioSettings,
  game,
}: VoiceAudioControllerBridgeProps) {
  const activatedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousGameRef = useRef(game);
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
    const previousGame = previousGameRef.current;
    previousGameRef.current = game;

    const playbackEventKey = detectVoicePlaybackEvent(previousGame, game);
    if (!playbackEventKey || !audioSettings.voice.events[playbackEventKey]) {
      return;
    }

    if (!activatedRef.current || audioSettings.muted) {
      return;
    }

    if (audioSettings.respectReducedMotion && prefersReducedMotion(window)) {
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

    const clipUrl = pickVoiceClipUrl(
      audioSettings.voice.actorId,
      definition.audioCategory,
      previousClipIndexRef.current,
    );
    if (!clipUrl) {
      return;
    }

    stopAudio(currentAudioRef.current);
    currentAudioRef.current = null;

    const audio = new Audio(clipUrl);
    audio.preload = 'auto';
    audio.volume = audioSettings.volume;
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
  }, [audioSettings, game]);

  return null;
}

function pickVoiceClipUrl(
  actorId: VoiceActorId,
  category: VoiceClipCategory,
  previousClipIndexes: Partial<Record<VoiceClipCategory, number>>,
) {
  const clips = getVoiceClipUrls(actorId, category);
  if (clips.length === 0) {
    return null;
  }

  if (clips.length === 1) {
    previousClipIndexes[category] = 0;
    return clips[0] ?? null;
  }

  const previousIndex = previousClipIndexes[category] ?? -1;
  let nextIndex = Math.floor(Math.random() * clips.length);
  if (nextIndex === previousIndex) {
    nextIndex = (nextIndex + 1) % clips.length;
  }

  previousClipIndexes[category] = nextIndex;
  return clips[nextIndex] ?? null;
}

function prefersReducedMotion(target: Window) {
  return typeof target.matchMedia === 'function'
    ? target.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
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
