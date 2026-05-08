import { useEffect, useState } from 'react';
import { Button } from '@realmfall/ui-react';
import { type AudioSettings } from '../../../app/audioSettings';
import { type GameplaySettings } from '../../../app/gameplaySettings';
import {
  deriveGraphicsPreset,
  type GraphicsSettings,
} from '../../../app/graphicsSettings';
import { type InterfaceSettings } from '../../../app/interfaceSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';
import { t } from '../../../i18n';
import { GameSettingsAudioPanel } from './GameSettingsAudioPanel';
import { GameSettingsGameplayPanel } from './GameSettingsGameplayPanel';
import { GameSettingsGraphicsPanel } from './GameSettingsGraphicsPanel';
import { GameSettingsInterfacePanel } from './GameSettingsInterfacePanel';
import { GameSettingsSavesPanel } from './GameSettingsSavesPanel';
import type {
  GameSettingsWindowContentProps,
  UpdateGameplaySettings,
  UpdateAudioSettings,
  UpdateGraphicsSettings,
  UpdateInterfaceSettings,
} from './types';
import styles from './styles.module.scss';

const TAB_ORDER = [
  'graphics',
  'audio',
  'interface',
  'gameplay',
  'saves',
] as const;

type SettingsTabId = (typeof TAB_ORDER)[number];

type BusyAction =
  | { kind: 'save' }
  | { kind: 'saveReload' }
  | { areaId: ResettableSaveAreaId; kind: 'reset' }
  | null;

export function GameSettingsWindowContent({
  audioSettings,
  gameplaySettings,
  graphicsSettings,
  interfaceSettings,
  onClose,
  onResetSaveArea,
  onSave,
  onSaveAndReload,
}: GameSettingsWindowContentProps) {
  const [activeTabId, setActiveTabId] = useState<SettingsTabId>('graphics');
  const [draftGraphicsSettings, setDraftGraphicsSettings] =
    useState<GraphicsSettings>(graphicsSettings);
  const [draftInterfaceSettings, setDraftInterfaceSettings] =
    useState<InterfaceSettings>(interfaceSettings);
  const [draftGameplaySettings, setDraftGameplaySettings] =
    useState<GameplaySettings>(gameplaySettings);
  const [draftAudioSettings, setDraftAudioSettings] =
    useState<AudioSettings>(audioSettings);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  useEffect(() => {
    setDraftGraphicsSettings(graphicsSettings);
  }, [graphicsSettings]);

  useEffect(() => {
    setDraftAudioSettings(audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    setDraftInterfaceSettings(interfaceSettings);
  }, [interfaceSettings]);

  useEffect(() => {
    setDraftGameplaySettings(gameplaySettings);
  }, [gameplaySettings]);

  const dirty =
    JSON.stringify(draftGraphicsSettings) !==
      JSON.stringify(graphicsSettings) ||
    JSON.stringify(draftAudioSettings) !== JSON.stringify(audioSettings) ||
    JSON.stringify(draftInterfaceSettings) !==
      JSON.stringify(interfaceSettings) ||
    JSON.stringify(draftGameplaySettings) !== JSON.stringify(gameplaySettings);

  const savePayload = {
    audio: draftAudioSettings,
    gameplay: draftGameplaySettings,
    graphics: draftGraphicsSettings,
    interface: draftInterfaceSettings,
  };
  const resettingAreaId =
    busyAction?.kind === 'reset' ? busyAction.areaId : null;

  const updateDraftGraphicsSettings: UpdateGraphicsSettings = (updater) => {
    setDraftGraphicsSettings((current) => {
      const nextSettings = updater(current);

      return {
        ...nextSettings,
        preset: deriveGraphicsPreset(nextSettings),
      };
    });
  };

  const updateDraftAudioSettings: UpdateAudioSettings = (updater) => {
    setDraftAudioSettings(updater);
  };

  const updateDraftInterfaceSettings: UpdateInterfaceSettings = (updater) => {
    setDraftInterfaceSettings(updater);
  };

  const updateDraftGameplaySettings: UpdateGameplaySettings = (updater) => {
    setDraftGameplaySettings(updater);
  };

  const handleResetSaveArea = async (areaId: ResettableSaveAreaId) => {
    setBusyAction({ areaId, kind: 'reset' });
    try {
      await onResetSaveArea(areaId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSave = async () => {
    setBusyAction({ kind: 'save' });
    try {
      await onSave(savePayload);
      onClose?.();
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveAndReload = async () => {
    setBusyAction({ kind: 'saveReload' });
    try {
      await onSaveAndReload(savePayload);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
        {TAB_ORDER.map((tabId) => (
          <Button
            unstyled
            key={tabId}
            id={`${tabId}-tab`}
            type="button"
            size="small"
            role="tab"
            aria-selected={activeTabId === tabId}
            aria-controls={`${tabId}-panel`}
            className={styles.tab}
            data-active={activeTabId === tabId}
            onClick={() => setActiveTabId(tabId)}
          >
            {t(`ui.settings.tabs.${tabId}`)}
          </Button>
        ))}
      </div>
      <div className={styles.content}>
        <section
          id={`${activeTabId}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTabId}-tab`}
          className={styles.tabPanel}
        >
          {activeTabId === 'graphics' ? (
            <GameSettingsGraphicsPanel
              graphicsSettings={draftGraphicsSettings}
              onChange={updateDraftGraphicsSettings}
            />
          ) : activeTabId === 'audio' ? (
            <GameSettingsAudioPanel
              audioSettings={draftAudioSettings}
              onChange={updateDraftAudioSettings}
            />
          ) : activeTabId === 'interface' ? (
            <GameSettingsInterfacePanel
              interfaceSettings={draftInterfaceSettings}
              onChange={updateDraftInterfaceSettings}
            />
          ) : activeTabId === 'gameplay' ? (
            <GameSettingsGameplayPanel
              gameplaySettings={draftGameplaySettings}
              onChange={updateDraftGameplaySettings}
            />
          ) : (
            <GameSettingsSavesPanel
              busyAreaId={resettingAreaId}
              onResetSaveArea={handleResetSaveArea}
            />
          )}
        </section>
        <div className={styles.actions}>
          <div className={styles.primaryActions}>
            <Button
              unstyled
              type="button"
              onClick={() => void handleSave()}
              disabled={busyAction !== null || !dirty}
            >
              {busyAction?.kind === 'save'
                ? t('ui.settings.actions.saving')
                : t('ui.settings.actions.save')}
            </Button>
            <Button
              unstyled
              type="button"
              onClick={() => void handleSaveAndReload()}
              disabled={busyAction !== null || !dirty}
            >
              {busyAction?.kind === 'saveReload'
                ? t('ui.settings.actions.savingReload')
                : t('ui.settings.actions.saveReload')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
