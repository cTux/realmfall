import { useState } from 'react';
import type { AudioSettings } from '../../audioSettings';
import type { GraphicsSettings } from '../../graphicsSettings';

export function useAppSettingsState(
  initialAudioSettings: AudioSettings,
  initialGraphicsSettings: GraphicsSettings,
) {
  const [audioSettings, setAudioSettings] =
    useState<AudioSettings>(initialAudioSettings);
  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>(
    initialGraphicsSettings,
  );

  return {
    audioSettings,
    graphicsSettings,
    setAudioSettings,
    setGraphicsSettings,
  };
}
