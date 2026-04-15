import type { WindowPosition } from '../../../app/constants';
import type { GraphicsSettings } from '../../../app/graphicsSettings';

export interface GameSettingsWindowProps {
  graphicsSettings: GraphicsSettings;
  onClose?: () => void;
  onMove: (position: WindowPosition) => void;
  onResetSaveData: () => Promise<void> | void;
  onSave: (settings: GraphicsSettings) => Promise<void>;
  onSaveAndReload: (settings: GraphicsSettings) => Promise<void>;
  position: WindowPosition;
  visible?: boolean;
}

export interface GameSettingsWindowContentProps {
  graphicsSettings: GraphicsSettings;
  onClose?: () => void;
  onResetSaveData: () => Promise<void> | void;
  onSave: (settings: GraphicsSettings) => Promise<void>;
  onSaveAndReload: (settings: GraphicsSettings) => Promise<void>;
}
