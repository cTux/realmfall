import { useState } from 'react';
import type { AudioSettings } from '../../audioSettings';
import type { GameplaySettings } from '../../gameplaySettings';
import type { GraphicsSettings } from '../../graphicsSettings';
import type { InterfaceSettings } from '../../interfaceSettings';

export function useAppSettingsState(
  initialAudioSettings: AudioSettings,
  initialGraphicsSettings: GraphicsSettings,
  initialInterfaceSettings: InterfaceSettings,
  initialGameplaySettings: GameplaySettings,
) {
  const [audioSettings, setAudioSettings] =
    useState<AudioSettings>(initialAudioSettings);
  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>(
    initialGraphicsSettings,
  );
  const [interfaceSettings, setInterfaceSettings] = useState<InterfaceSettings>(
    initialInterfaceSettings,
  );
  const [gameplaySettings, setGameplaySettings] = useState<GameplaySettings>(
    initialGameplaySettings,
  );

  return {
    audioSettings,
    gameplaySettings,
    graphicsSettings,
    interfaceSettings,
    setAudioSettings,
    setGameplaySettings,
    setGraphicsSettings,
    setInterfaceSettings,
  };
}
