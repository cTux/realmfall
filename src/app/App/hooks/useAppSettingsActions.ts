import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { GameState } from '../../../game/state';
import type { UiAudioController } from '../../audio/UiAudioContext';
import {
  clearAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from '../../audioSettings';
import {
  clearGraphicsSettings,
  saveGraphicsSettings,
  type GraphicsSettings,
} from '../../graphicsSettings';
import { clearWorldMapSettings } from '../../worldMapSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';
import { setHomeHexForApp } from './useAppLifecycle';

export function useAppSettingsActions({
  paused,
  persistNow,
  setAudioSettings,
  setGame,
  setGraphicsSettings,
  uiAudio,
}: {
  paused: boolean;
  persistNow: () => Promise<void>;
  setAudioSettings: Dispatch<SetStateAction<AudioSettings>>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setGraphicsSettings: Dispatch<SetStateAction<GraphicsSettings>>;
  uiAudio: UiAudioController;
}) {
  const handleSaveSettings = useCallback(
    async ({
      audio: nextAudioSettings,
      graphics: nextGraphicsSettings,
    }: {
      audio: AudioSettings;
      graphics: GraphicsSettings;
    }) => {
      setAudioSettings(nextAudioSettings);
      setGraphicsSettings(nextGraphicsSettings);
      saveAudioSettings(nextAudioSettings);
      saveGraphicsSettings(nextGraphicsSettings);
      uiAudio.applySettings(nextAudioSettings);
      await persistNow();
      uiAudio.success();
    },
    [persistNow, setAudioSettings, setGraphicsSettings, uiAudio],
  );

  const handleSaveSettingsAndReload = useCallback(
    async (settings: { audio: AudioSettings; graphics: GraphicsSettings }) => {
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
        case 'game':
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
