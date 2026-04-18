import type { WindowPosition } from '../../../app/constants';
import type { AudioSettings } from '../../../app/audioSettings';
import type { GraphicsSettings } from '../../../app/graphicsSettings';

export interface GameSettingsWindowProps {
  audioSettings: AudioSettings;
  graphicsSettings: GraphicsSettings;
  onClose?: () => void;
  onMove: (position: WindowPosition) => void;
  onResetSaveData: () => Promise<void> | void;
  onSave: (settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  }) => Promise<void>;
  onSaveAndReload: (settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  }) => Promise<void>;
  position: WindowPosition;
  visible?: boolean;
}

export interface GameSettingsWindowContentProps {
  audioSettings: AudioSettings;
  graphicsSettings: GraphicsSettings;
  onClose?: () => void;
  onResetSaveData: () => Promise<void> | void;
  onSave: (settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  }) => Promise<void>;
  onSaveAndReload: (settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  }) => Promise<void>;
}
