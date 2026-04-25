import { tiks } from '@rexa-developer/tiks';
import { useEffect, useEffectEvent, useMemo, useRef } from 'react';
import type {
  AudioSettings,
  AudioSoundEffectsSettings,
} from '../audioSettings';
import type { UiAudioController } from './UiAudioContext';

const HOVER_SELECTOR = [
  'button:not(:disabled)',
  '[role="tab"]',
  'input:not([type="hidden"]):not(:disabled)',
  'select:not(:disabled)',
  '[data-ui-audio-hover="true"]',
].join(', ');
const HOVER_SKIP_SELECTOR = '[data-ui-audio-hover="off"]';
const CLICK_SELECTOR = ['button:not(:disabled)', '[role="tab"]'].join(', ');
const CLICK_SKIP_SELECTOR = '[data-ui-audio-click="off"]';

export function useUiAudioController(
  settings: AudioSettings,
): UiAudioController {
  const initializedRef = useRef(false);
  const activatedRef = useRef(false);
  const settingsRef = useRef(settings);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  const syncEngine = (nextSettings: AudioSettings) => {
    const shouldMute =
      nextSettings.muted ||
      (nextSettings.respectReducedMotion &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    tiks.setTheme(nextSettings.theme);
    tiks.setVolume(nextSettings.uiVolume);
    if (shouldMute) {
      tiks.mute();
    } else {
      tiks.unmute();
    }
  };

  const ensureReady = () => {
    if (typeof window === 'undefined' || !activatedRef.current) {
      return false;
    }

    if (!initializedRef.current) {
      tiks.init();
      initializedRef.current = true;
    }

    syncEngine(settingsRef.current);
    return true;
  };

  const activateAudio = useEffectEvent(() => {
    if (activatedRef.current) {
      return;
    }

    activatedRef.current = true;

    try {
      ensureReady();
    } catch {
      // Audio is enhancement-only. Ignore activation failures.
    }
  });

  const play = (callback: () => void) => {
    try {
      if (!ensureReady()) {
        return;
      }
      callback();
    } catch {
      // Audio is enhancement-only. Ignore playback failures.
    }
  };

  const playSound = (
    soundEffect: keyof AudioSoundEffectsSettings,
    callback: () => void,
  ) => {
    if (!settingsRef.current.soundEffects[soundEffect]) {
      return;
    }

    play(callback);
  };

  const applySettings = (nextSettings: AudioSettings) => {
    settingsRef.current = nextSettings;

    try {
      if (!ensureReady()) {
        return;
      }
      syncEngine(nextSettings);
    } catch {
      // Audio is enhancement-only. Ignore playback failures.
    }
  };

  useEffect(() => {
    settingsRef.current = settings;
    if (!initializedRef.current) {
      return;
    }

    try {
      syncEngine(settings);
    } catch {
      // Audio is enhancement-only. Ignore sync failures from unexpected payloads.
    }
  }, [settings]);

  const handlePointerOver = useEffectEvent((event: PointerEvent) => {
    const target = getInteractiveTarget(
      event.target,
      HOVER_SELECTOR,
      HOVER_SKIP_SELECTOR,
    );
    if (!target || hoveredElementRef.current === target) {
      return;
    }

    hoveredElementRef.current = target;
    playSound('hover', () => tiks.hover());
  });

  const handlePointerOut = useEffectEvent((event: PointerEvent) => {
    const target = getInteractiveTarget(
      event.target,
      HOVER_SELECTOR,
      HOVER_SKIP_SELECTOR,
    );
    if (!target || hoveredElementRef.current !== target) {
      return;
    }

    if (
      event.relatedTarget instanceof Node &&
      target.contains(event.relatedTarget)
    ) {
      return;
    }

    hoveredElementRef.current = null;
  });

  const handleFocusIn = useEffectEvent((event: FocusEvent) => {
    const target = getInteractiveTarget(
      event.target,
      HOVER_SELECTOR,
      HOVER_SKIP_SELECTOR,
    );
    if (!target || hoveredElementRef.current === target) {
      return;
    }

    hoveredElementRef.current = target;
    playSound('hover', () => tiks.hover());
  });

  const handleClick = useEffectEvent((event: MouseEvent) => {
    const target = getInteractiveTarget(
      event.target,
      CLICK_SELECTOR,
      CLICK_SKIP_SELECTOR,
    );
    if (!target) {
      return;
    }

    playSound('click', () => tiks.click());
  });

  const handleChange = useEffectEvent((event: Event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      playSound('toggle', () => tiks.toggle(target.checked));
      return;
    }

    if (target instanceof HTMLInputElement && target.type === 'range') {
      playSound('pop', () => tiks.pop());
      return;
    }

    if (target instanceof HTMLSelectElement) {
      playSound('pop', () => tiks.pop());
    }
  });

  useEffect(() => {
    document.addEventListener('pointerdown', activateAudio, true);
    document.addEventListener('keydown', activateAudio, true);
    document.addEventListener('pointerover', handlePointerOver, true);
    document.addEventListener('pointerout', handlePointerOut, true);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('change', handleChange, true);

    return () => {
      document.removeEventListener('pointerdown', activateAudio, true);
      document.removeEventListener('keydown', activateAudio, true);
      document.removeEventListener('pointerover', handlePointerOver, true);
      document.removeEventListener('pointerout', handlePointerOut, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('change', handleChange, true);
    };
  }, []);

  return useMemo(
    () => ({
      applySettings,
      click: () => playSound('click', () => tiks.click()),
      error: () => playSound('error', () => tiks.error()),
      hover: () => playSound('hover', () => tiks.hover()),
      notify: () => playSound('notify', () => tiks.notify()),
      pop: () => playSound('pop', () => tiks.pop()),
      success: () => playSound('success', () => tiks.success()),
      swoosh: () => playSound('swoosh', () => tiks.swoosh()),
      toggle: (nextState: boolean) =>
        playSound('toggle', () => tiks.toggle(nextState)),
      warning: () => playSound('warning', () => tiks.warning()),
    }),
    [],
  );
}

function getInteractiveTarget(
  target: EventTarget | null,
  selector: string,
  skipSelector: string,
) {
  if (!(target instanceof Element)) {
    return null;
  }

  const interactive = target.closest(selector);
  if (!(interactive instanceof HTMLElement)) {
    return null;
  }

  if (interactive.closest(skipSelector)) {
    return null;
  }

  return interactive;
}
