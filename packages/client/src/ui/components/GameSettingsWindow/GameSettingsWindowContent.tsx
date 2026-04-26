import { useEffect, useState } from 'react';
import { type AudioSettings } from '../../../app/audioSettings';
import {
  deriveGraphicsPreset,
  type GraphicsSettings,
} from '../../../app/graphicsSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';
import { t } from '../../../i18n';
import { GameSettingsAudioPanel } from './GameSettingsAudioPanel';
import { GameSettingsGraphicsPanel } from './GameSettingsGraphicsPanel';
import { GameSettingsSavesPanel } from './GameSettingsSavesPanel';
import type {
  GameSettingsWindowContentProps,
  UpdateAudioSettings,
  UpdateGraphicsSettings,
} from './types';
import styles from './styles.module.scss';

const TAB_ORDER = ['graphics', 'audio', 'saves'] as const;

type SettingsTabId = (typeof TAB_ORDER)[number];

type BusyAction =
  | { kind: 'save' }
  | { kind: 'saveReload' }
  | { areaId: ResettableSaveAreaId; kind: 'reset' }
  | null;

export function GameSettingsWindowContent({
  audioSettings,
  graphicsSettings,
  onClose,
  onResetSaveArea,
  onSave,
  onSaveAndReload,
}: GameSettingsWindowContentProps) {
  const [activeTabId, setActiveTabId] = useState<SettingsTabId>('graphics');
  const [draftGraphicsSettings, setDraftGraphicsSettings] =
    useState<GraphicsSettings>(graphicsSettings);
  const [draftAudioSettings, setDraftAudioSettings] =
    useState<AudioSettings>(audioSettings);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  useEffect(() => {
    setDraftGraphicsSettings(graphicsSettings);
  }, [graphicsSettings]);

  useEffect(() => {
    setDraftAudioSettings(audioSettings);
  }, [audioSettings]);

  const dirty =
    JSON.stringify(draftGraphicsSettings) !==
      JSON.stringify(graphicsSettings) ||
    JSON.stringify(draftAudioSettings) !== JSON.stringify(audioSettings);

  const savePayload = {
    audio: draftAudioSettings,
    graphics: draftGraphicsSettings,
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
      <div className={styles.content}>
        <section
          id={`${activeTabId}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTabId}-tab`}
          className={`${styles.tabPanel} ${activeTabId === 'audio' ? styles.audioTabPanel : ''}`}
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
          ) : (
            <GameSettingsSavesPanel
              busyAreaId={resettingAreaId}
              onResetSaveArea={handleResetSaveArea}
            />
          )}
        </section>
        <div className={styles.actions}>
          <div className={styles.primaryActions}>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busyAction !== null || !dirty}
            >
              {busyAction?.kind === 'save'
                ? t('ui.settings.actions.saving')
                : t('ui.settings.actions.save')}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAndReload()}
              disabled={busyAction !== null || !dirty}
            >
              {busyAction?.kind === 'saveReload'
                ? t('ui.settings.actions.savingReload')
                : t('ui.settings.actions.saveReload')}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.tabs} role="tablist" aria-orientation="vertical">
        {TAB_ORDER.map((tabId) => (
          <button
            key={tabId}
            id={`${tabId}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTabId === tabId}
            aria-controls={`${tabId}-panel`}
            className={styles.tab}
            data-active={activeTabId === tabId}
            onClick={() => setActiveTabId(tabId)}
          >
            {t(`ui.settings.tabs.${tabId}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
