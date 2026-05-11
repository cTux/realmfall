import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { GameState } from '@realmfall/core/game/stateTypes';
import type { UiAudioController } from '../../audio/UiAudioContext';
import {
  clearAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from '../../audioSettings';
import {
  clearGameplaySettings,
  saveGameplaySettings,
  type GameplaySettings,
} from '../../gameplaySettings';
import {
  clearGraphicsSettings,
  saveGraphicsSettings,
  type GraphicsSettings,
} from '../../graphicsSettings';
import {
  clearInterfaceSettings,
  saveInterfaceSettings,
  type InterfaceSettings,
} from '../../interfaceSettings';
import {
  applyInterfaceFontFamily,
  loadInterfaceFontFamily,
} from '../../interfaceFonts';
import { clearWorldMapSettings } from '../../worldMapSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';
import { setHomeHexForApp } from './useAppLifecycle';

export function useAppSettingsActions({
  paused,
  persistNow,
  setAudioSettings,
  setGame,
  setGameplaySettings,
  setGraphicsSettings,
  setInterfaceSettings,
  uiAudio,
}: {
  paused: boolean;
  persistNow: () => Promise<void>;
  setAudioSettings: Dispatch<SetStateAction<AudioSettings>>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setGameplaySettings: Dispatch<SetStateAction<GameplaySettings>>;
  setGraphicsSettings: Dispatch<SetStateAction<GraphicsSettings>>;
  setInterfaceSettings: Dispatch<SetStateAction<InterfaceSettings>>;
  uiAudio: UiAudioController;
}) {
  const handleSaveSettings = useCallback(
    async ({
      audio: nextAudioSettings,
      gameplay: nextGameplaySettings,
      graphics: nextGraphicsSettings,
      interface: nextInterfaceSettings,
    }: {
      audio: AudioSettings;
      gameplay: GameplaySettings;
      graphics: GraphicsSettings;
      interface: InterfaceSettings;
    }) => {
      await loadInterfaceFontFamily(nextInterfaceSettings.fontFamily);
      applyInterfaceFontFamily(nextInterfaceSettings.fontFamily);
      setAudioSettings(nextAudioSettings);
      setGameplaySettings(nextGameplaySettings);
      setGraphicsSettings(nextGraphicsSettings);
      setInterfaceSettings(nextInterfaceSettings);
      saveAudioSettings(nextAudioSettings);
      saveGameplaySettings(nextGameplaySettings);
      saveGraphicsSettings(nextGraphicsSettings);
      saveInterfaceSettings(nextInterfaceSettings);
      uiAudio.applySettings(nextAudioSettings);
      await persistNow();
      uiAudio.success();
    },
    [
      persistNow,
      setAudioSettings,
      setGameplaySettings,
      setGraphicsSettings,
      setInterfaceSettings,
      uiAudio,
    ],
  );

  const handleSaveSettingsAndReload = useCallback(
    async (settings: {
      audio: AudioSettings;
      gameplay: GameplaySettings;
      graphics: GraphicsSettings;
      interface: InterfaceSettings;
    }) => {
      await handleSaveSettings(settings);
      uiAudio.notify();
      window.location.reload();
    },
    [handleSaveSettings, uiAudio],
  );

  const handleResetSaveArea = useCallback(
    async (areaId: ResettableSaveAreaId) => {
      uiAudio.error();

      switch (areaId) {
        case 'game': {
          const { clearEncryptedDungeonStates, clearEncryptedState } =
            await import('../../../persistence/storage');
          await clearEncryptedState(areaId);
          await clearEncryptedDungeonStates();
          break;
        }
        case 'ui': {
          const { clearEncryptedState } =
            await import('../../../persistence/storage');
          await clearEncryptedState(areaId);
          break;
        }
        case 'audio':
          clearAudioSettings();
          break;
        case 'graphics':
          clearGraphicsSettings();
          break;
        case 'interface':
          clearInterfaceSettings();
          break;
        case 'gameplay':
          clearGameplaySettings();
          break;
        case 'worldMap':
          clearWorldMapSettings();
          break;
      }

      window.location.reload();
    },
    [uiAudio],
  );

  const handleSetHome = useCallback(() => {
    if (paused) {
      return;
    }

    setHomeHexForApp(setGame);
  }, [paused, setGame]);

  return {
    handleResetSaveArea,
    handleSaveSettings,
    handleSaveSettingsAndReload,
    handleSetHome,
  };
}
