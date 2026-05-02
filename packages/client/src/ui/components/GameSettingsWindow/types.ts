import type { AudioSettings } from '../../../app/audioSettings';
import type { GameplaySettings } from '../../../app/gameplaySettings';
import type { GraphicsSettings } from '../../../app/graphicsSettings';
import type { InterfaceSettings } from '../../../app/interfaceSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';
import type { ManagedWindowShellProps } from '../managedWindowProps';

export interface GameSettingsSavePayload {
  audio: AudioSettings;
  gameplay: GameplaySettings;
  graphics: GraphicsSettings;
  interface: InterfaceSettings;
}

export type UpdateAudioSettings = (
  updater: (current: AudioSettings) => AudioSettings,
) => void;

export type UpdateGraphicsSettings = (
  updater: (current: GraphicsSettings) => GraphicsSettings,
) => void;

export type UpdateInterfaceSettings = (
  updater: (current: InterfaceSettings) => InterfaceSettings,
) => void;

export type UpdateGameplaySettings = (
  updater: (current: GameplaySettings) => GameplaySettings,
) => void;

export interface GameSettingsWindowProps extends ManagedWindowShellProps {
  audioSettings: AudioSettings;
  gameplaySettings: GameplaySettings;
  graphicsSettings: GraphicsSettings;
  interfaceSettings: InterfaceSettings;
  onResetSaveArea: (areaId: ResettableSaveAreaId) => Promise<void>;
  onSave: (settings: GameSettingsSavePayload) => Promise<void>;
  onSaveAndReload: (settings: GameSettingsSavePayload) => Promise<void>;
}

export interface GameSettingsWindowContentProps {
  audioSettings: AudioSettings;
  gameplaySettings: GameplaySettings;
  graphicsSettings: GraphicsSettings;
  interfaceSettings: InterfaceSettings;
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

export interface GameSettingsInterfacePanelProps {
  interfaceSettings: InterfaceSettings;
  onChange: UpdateInterfaceSettings;
}

export interface GameSettingsGameplayPanelProps {
  gameplaySettings: GameplaySettings;
  onChange: UpdateGameplaySettings;
}
