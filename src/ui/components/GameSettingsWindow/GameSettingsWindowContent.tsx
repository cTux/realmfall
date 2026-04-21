import { useEffect, useRef, useState } from 'react';
import { type AudioSettings } from '../../../app/audioSettings';
import { useUiAudio } from '../../../app/audio/UiAudioContext';
import {
  deriveGraphicsPreset,
  type GraphicsSettings,
} from '../../../app/graphicsSettings';
import { t } from '../../../i18n';
import { GameSettingsAudioPanel } from './GameSettingsAudioPanel';
import { GameSettingsGraphicsPanel } from './GameSettingsGraphicsPanel';
import type {
  GameSettingsWindowContentProps,
  UpdateAudioSettings,
  UpdateGraphicsSettings,
} from './types';
import styles from './styles.module.scss';

const RESET_HOLD_MS = 5000;
const TAB_ORDER = ['graphics', 'audio'] as const;

type SettingsTabId = (typeof TAB_ORDER)[number];

export function GameSettingsWindowContent({
  audioSettings,
  graphicsSettings,
  onClose,
  onResetSaveData,
  onSave,
  onSaveAndReload,
}: GameSettingsWindowContentProps) {
  const audio = useUiAudio();
  const [activeTabId, setActiveTabId] = useState<SettingsTabId>('graphics');
  const [draftGraphicsSettings, setDraftGraphicsSettings] =
    useState<GraphicsSettings>(graphicsSettings);
  const [draftAudioSettings, setDraftAudioSettings] =
    useState<AudioSettings>(audioSettings);
  const [busyAction, setBusyAction] = useState<
    'save' | 'saveReload' | 'reset' | null
  >(null);
  const [resetProgress, setResetProgress] = useState(0);
  const resetFrameRef = useRef<number | null>(null);
  const resetStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setDraftGraphicsSettings(graphicsSettings);
  }, [graphicsSettings]);

  useEffect(() => {
    setDraftAudioSettings(audioSettings);
  }, [audioSettings]);

  useEffect(
    () => () => {
      if (resetFrameRef.current !== null) {
        window.cancelAnimationFrame(resetFrameRef.current);
      }
    },
    [],
  );

  const dirty =
    JSON.stringify(draftGraphicsSettings) !==
      JSON.stringify(graphicsSettings) ||
    JSON.stringify(draftAudioSettings) !== JSON.stringify(audioSettings);

  const savePayload = {
    audio: draftAudioSettings,
    graphics: draftGraphicsSettings,
  };

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

  const cancelResetHold = () => {
    if (resetFrameRef.current !== null) {
      window.cancelAnimationFrame(resetFrameRef.current);
      resetFrameRef.current = null;
    }
    resetStartTimeRef.current = null;
    setResetProgress(0);
  };

  const completeResetHold = async () => {
    cancelResetHold();
    setBusyAction('reset');
    try {
      await onResetSaveData();
    } finally {
      setBusyAction(null);
    }
  };

  const startResetHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (busyAction) return;

    audio.warning();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    resetStartTimeRef.current = performance.now();

    const tick = (timestamp: number) => {
      if (resetStartTimeRef.current === null) return;

      const nextProgress = Math.min(
        1,
        (timestamp - resetStartTimeRef.current) / RESET_HOLD_MS,
      );
      setResetProgress(nextProgress);

      if (nextProgress >= 1) {
        void completeResetHold();
        return;
      }

      resetFrameRef.current = window.requestAnimationFrame(tick);
    };

    resetFrameRef.current = window.requestAnimationFrame(tick);
  };

  const handleSave = async () => {
    setBusyAction('save');
    try {
      await onSave(savePayload);
      onClose?.();
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveAndReload = async () => {
    setBusyAction('saveReload');
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
          ) : (
            <GameSettingsAudioPanel
              audioSettings={draftAudioSettings}
              onChange={updateDraftAudioSettings}
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
              {busyAction === 'save'
                ? t('ui.settings.actions.saving')
                : t('ui.settings.actions.save')}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAndReload()}
              disabled={busyAction !== null || !dirty}
            >
              {busyAction === 'saveReload'
                ? t('ui.settings.actions.savingReload')
                : t('ui.settings.actions.saveReload')}
            </button>
          </div>
          <button
            type="button"
            className={styles.resetButton}
            data-busy={busyAction === 'reset'}
            disabled={busyAction !== null && busyAction !== 'reset'}
            style={{
              ['--reset-progress' as string]: `${resetProgress * 100}%`,
            }}
            onPointerDown={startResetHold}
            onPointerUp={cancelResetHold}
            onPointerCancel={cancelResetHold}
            onLostPointerCapture={cancelResetHold}
          >
            <span className={styles.resetFill} aria-hidden="true" />
            <span className={styles.resetText}>
              {busyAction === 'reset'
                ? t('ui.settings.actions.resetting')
                : t('ui.settings.actions.resetSaveData')}
            </span>
          </button>
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
