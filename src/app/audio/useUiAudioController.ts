import { tiks } from '@rexa-developer/tiks';
import { useEffect, useEffectEvent, useMemo, useRef } from 'react';
import type { AudioSettings } from '../audioSettings';
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
  const settingsRef = useRef(settings);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  const syncEngine = (nextSettings: AudioSettings) => {
    const shouldMute =
      nextSettings.muted ||
      (nextSettings.respectReducedMotion &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    tiks.setTheme(nextSettings.theme);
    tiks.setVolume(nextSettings.volume);
    if (shouldMute) {
      tiks.mute();
    } else {
      tiks.unmute();
    }
  };

  const ensureReady = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!initializedRef.current) {
      tiks.init();
      initializedRef.current = true;
    }

    syncEngine(settingsRef.current);
    return true;
  };

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

  useEffect(() => {
    settingsRef.current = settings;
    if (initializedRef.current) {
      syncEngine(settings);
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
    play(() => tiks.hover());
  });

  const handlePointerOut = useEffectEvent((event: PointerEvent) => {
    const target = getInteractiveTarget(
      event.target,
      HOVER_SELECTOR,
      HOVER_SKIP_SELECTOR,
    );
    if (target && hoveredElementRef.current === target) {
      hoveredElementRef.current = null;
    }
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
    play(() => tiks.hover());
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

    play(() => tiks.click());
  });

  const handleChange = useEffectEvent((event: Event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      play(() => tiks.toggle(target.checked));
      return;
    }

    if (target instanceof HTMLInputElement && target.type === 'range') {
      play(() => tiks.pop());
      return;
    }

    if (target instanceof HTMLSelectElement) {
      play(() => tiks.pop());
    }
  });

  useEffect(() => {
    document.addEventListener('pointerover', handlePointerOver, true);
    document.addEventListener('pointerout', handlePointerOut, true);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('change', handleChange, true);

    return () => {
      document.removeEventListener('pointerover', handlePointerOver, true);
      document.removeEventListener('pointerout', handlePointerOut, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('change', handleChange, true);
    };
  }, []);

  return useMemo(
    () => ({
      click: () => play(() => tiks.click()),
      error: () => play(() => tiks.error()),
      hover: () => play(() => tiks.hover()),
      notify: () => play(() => tiks.notify()),
      pop: () => play(() => tiks.pop()),
      success: () => play(() => tiks.success()),
      swoosh: () => play(() => tiks.swoosh()),
      toggle: (nextState: boolean) => play(() => tiks.toggle(nextState)),
      warning: () => play(() => tiks.warning()),
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
