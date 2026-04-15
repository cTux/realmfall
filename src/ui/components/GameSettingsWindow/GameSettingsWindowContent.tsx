import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../../i18n';
import {
  GRAPHICS_SETTINGS_OPTIONS,
  type GraphicsSettings,
} from '../../../app/graphicsSettings';
import { Switch } from '../Switch';
import { Tabs } from '../Tabs';
import type { GameSettingsWindowContentProps } from './types';
import styles from './styles.module.scss';

const RESET_HOLD_MS = 5000;
const GRAPHICS_TAB_ID = 'graphics';

export function GameSettingsWindowContent({
  graphicsSettings,
  onClose,
  onResetSaveData,
  onSave,
  onSaveAndReload,
}: GameSettingsWindowContentProps) {
  const [activeTabId, setActiveTabId] = useState(GRAPHICS_TAB_ID);
  const [draftSettings, setDraftSettings] =
    useState<GraphicsSettings>(graphicsSettings);
  const [busyAction, setBusyAction] = useState<
    'save' | 'saveReload' | 'reset' | null
  >(null);
  const [resetProgress, setResetProgress] = useState(0);
  const resetFrameRef = useRef<number | null>(null);
  const resetStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setDraftSettings(graphicsSettings);
  }, [graphicsSettings]);

  useEffect(
    () => () => {
      if (resetFrameRef.current !== null) {
        window.cancelAnimationFrame(resetFrameRef.current);
      }
    },
    [],
  );

  const tabs = useMemo(
    () => [{ id: GRAPHICS_TAB_ID, label: t('ui.settings.tabs.graphics') }],
    [],
  );

  const dirty =
    JSON.stringify(draftSettings) !== JSON.stringify(graphicsSettings);

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
      await onSave(draftSettings);
      onClose?.();
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveAndReload = async () => {
    setBusyAction('saveReload');
    try {
      await onSaveAndReload(draftSettings);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={styles.panel}>
      <Tabs activeTabId={activeTabId} tabs={tabs} onChange={setActiveTabId} />
      {activeTabId === GRAPHICS_TAB_ID ? (
        <section
          id={`${GRAPHICS_TAB_ID}-panel`}
          role="tabpanel"
          aria-labelledby={`${GRAPHICS_TAB_ID}-tab`}
          className={styles.tabPanel}
        >
          <div className={styles.switches}>
            {GRAPHICS_SETTINGS_OPTIONS.map((option) => (
              <Switch
                key={option.key}
                checked={draftSettings[option.key]}
                label={t(option.labelKey)}
                description={t(option.descriptionKey)}
                onChange={(checked) =>
                  setDraftSettings((current) => ({
                    ...current,
                    [option.key]: checked,
                  }))
                }
              />
            ))}
          </div>
        </section>
      ) : null}
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
          style={{ ['--reset-progress' as string]: `${resetProgress * 100}%` }}
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
  );
}
