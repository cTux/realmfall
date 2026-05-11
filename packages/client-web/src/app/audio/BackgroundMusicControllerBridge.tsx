import type { AudioSettings } from '../audioSettings';
import type { BackgroundMusicMood } from './backgroundMusic';
import { useBackgroundMusicController } from './useBackgroundMusicController';

interface BackgroundMusicControllerBridgeProps {
  audioSettings: AudioSettings;
  mood: BackgroundMusicMood;
}

export function BackgroundMusicControllerBridge({
  audioSettings,
  mood,
}: BackgroundMusicControllerBridgeProps) {
  useBackgroundMusicController({ audioSettings, mood });
  return null;
}
