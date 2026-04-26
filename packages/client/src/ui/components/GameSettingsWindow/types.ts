import type { AudioSettings } from '../../../app/audioSettings';
import type { GraphicsSettings } from '../../../app/graphicsSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';
import type { ManagedWindowShellProps } from '../managedWindowProps';

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

export interface GameSettingsWindowProps extends ManagedWindowShellProps {
  audioSettings: AudioSettings;
  graphicsSettings: GraphicsSettings;
  onResetSaveArea: (areaId: ResettableSaveAreaId) => Promise<void>;
  onSave: (settings: GameSettingsSavePayload) => Promise<void>;
  onSaveAndReload: (settings: GameSettingsSavePayload) => Promise<void>;
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
