import { useEffect, useState } from 'react';

const AUDIO_BRIDGE_ACTIVATION_EVENTS = [
  'keydown',
  'mousedown',
  'pointerdown',
  'touchstart',
] as const;

export function useAudioBridgeActivation(
  target: Document | null = typeof document === 'undefined' ? null : document,
) {
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated || !target) {
      return;
    }

    const activate = () => {
      setActivated(true);
    };

    AUDIO_BRIDGE_ACTIVATION_EVENTS.forEach((eventName) => {
      target.addEventListener(eventName, activate, {
        passive: true,
      });
    });

    return () => {
      AUDIO_BRIDGE_ACTIVATION_EVENTS.forEach((eventName) => {
        target.removeEventListener(eventName, activate);
      });
    };
  }, [activated, target]);

  return activated;
}
