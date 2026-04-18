import { useEffect } from 'react';
import type { AudioSettings } from '../audioSettings';
import type { UiAudioController } from './UiAudioContext';
import { useUiAudioController } from './useUiAudioController';

interface UiAudioControllerBridgeProps {
  audioSettings: AudioSettings;
  onChange: (controller: UiAudioController) => void;
}

export function UiAudioControllerBridge({
  audioSettings,
  onChange,
}: UiAudioControllerBridgeProps) {
  const controller = useUiAudioController(audioSettings);

  useEffect(() => {
    onChange(controller);
  }, [controller, onChange]);

  return null;
}
