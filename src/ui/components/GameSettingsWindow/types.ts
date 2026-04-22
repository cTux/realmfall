import type { WindowPosition } from '../../../app/constants';
import type { AudioSettings } from '../../../app/audioSettings';
import type { GraphicsSettings } from '../../../app/graphicsSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';

export interface GameSettingsSavePayload {
  audio: AudioSettings;
  graphics: GraphicsSettings;
}

export type UpdateAudioSettings = (
  updater: (current: AudioSettings) => AudioSettings,
) => void;

export type UpdateGraphicsSettings = (
  updater: (current: GraphicsSettings) => GraphicsSettings,
) => void;

export interface GameSettingsWindowProps {
  audioSettings: AudioSettings;
  graphicsSettings: GraphicsSettings;
  onClose?: () => void;
  onMove: (position: WindowPosition) => void;
  onResetSaveArea: (areaId: ResettableSaveAreaId) => Promise<void>;
  onSave: (settings: GameSettingsSavePayload) => Promise<void>;
  onSaveAndReload: (settings: GameSettingsSavePayload) => Promise<void>;
  position: WindowPosition;
  visible?: boolean;
}

export interface GameSettingsWindowContentProps {
  audioSettings: AudioSettings;
  graphicsSettings: GraphicsSettings;
  onClose?: () => void;
  onResetSaveArea: (areaId: ResettableSaveAreaId) => Promise<void>;
  onSave: (settings: GameSettingsSavePayload) => Promise<void>;
  onSaveAndReload: (settings: GameSettingsSavePayload) => Promise<void>;
}

export interface GameSettingsSavesPanelProps {
  busyAreaId: ResettableSaveAreaId | null;
  onResetSaveArea: (areaId: ResettableSaveAreaId) => Promise<void>;
}

export interface GameSettingsGraphicsPanelProps {
  graphicsSettings: GraphicsSettings;
  onChange: UpdateGraphicsSettings;
}

export interface GameSettingsAudioPanelProps {
  audioSettings: AudioSettings;
  onChange: UpdateAudioSettings;
}
