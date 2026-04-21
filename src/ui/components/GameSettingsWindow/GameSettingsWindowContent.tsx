import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AUDIO_SETTINGS_SOUND_EFFECT_OPTIONS,
  AUDIO_SETTINGS_TOGGLE_OPTIONS,
  AUDIO_SETTINGS_VOICE_EVENT_OPTIONS,
  AUDIO_THEME_OPTIONS,
  type AudioSettings,
} from '../../../app/audioSettings';
import { VOICE_ACTOR_OPTIONS } from '../../../app/audio/voiceActors';
import { useUiAudio } from '../../../app/audio/UiAudioContext';
import {
  applyGraphicsPreset,
  deriveGraphicsPreset,
  GRAPHICS_PRESET_OPTIONS,
  GRAPHICS_SETTINGS_OPTIONS,
  type GraphicsSettings,
} from '../../../app/graphicsSettings';
import { t } from '../../../i18n';
import { Switch } from '../Switch';
import type { GameSettingsWindowContentProps } from './types';
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

  const tabs = useMemo(
    () =>
      [
        { id: 'graphics', label: t('ui.settings.tabs.graphics') },
        { id: 'audio', label: t('ui.settings.tabs.audio') },
      ] satisfies Array<{ id: SettingsTabId; label: string }>,
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

  const updateDraftGraphicsSettings = (
    updater: (current: GraphicsSettings) => GraphicsSettings,
  ) => {
    setDraftGraphicsSettings((current) => {
      const nextSettings = updater(current);

      return {
        ...nextSettings,
        preset: deriveGraphicsPreset(nextSettings),
      };
    });
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
            <div className={styles.audioPanel}>
              <div
                className={styles.themeField}
                role="radiogroup"
                aria-label={t('ui.settings.graphics.preset.label')}
              >
                <div className={styles.themeHeader}>
                  <span className={styles.rangeLabel}>
                    {t('ui.settings.graphics.preset.label')}
                  </span>
                  <span className={styles.rangeValue}>
                    {t(
                      `ui.settings.graphics.preset.${draftGraphicsSettings.preset}.label`,
                    )}
                  </span>
                </div>
                <span className={styles.rangeDescription}>
                  {t('ui.settings.graphics.preset.description')}
                </span>
                <div className={styles.graphicsPresetOptions}>
                  {GRAPHICS_PRESET_OPTIONS.map((option) => {
                    const selected =
                      draftGraphicsSettings.preset === option.value;

                    return (
                      <button
                        key={option.value}
                        id={`graphics-preset-${option.value}`}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={styles.themeOption}
                        data-active={selected}
                        onClick={() =>
                          setDraftGraphicsSettings(
                            applyGraphicsPreset(option.value),
                          )
                        }
                      >
                        <span className={styles.themeOptionLabel}>
                          {t(option.labelKey)}
                        </span>
                        <span className={styles.themeOptionDescription}>
                          {t(option.descriptionKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.switches}>
                {GRAPHICS_SETTINGS_OPTIONS.map((option) => (
                  <Switch
                    key={option.key}
                    checked={draftGraphicsSettings[option.key]}
                    label={t(option.labelKey)}
                    description={t(option.descriptionKey)}
                    onChange={(checked) =>
                      updateDraftGraphicsSettings((current) => ({
                        ...current,
                        [option.key]: checked,
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.audioPanel}>
              <div className={styles.switches}>
                {AUDIO_SETTINGS_TOGGLE_OPTIONS.map((option) => (
                  <Switch
                    key={option.key}
                    checked={draftAudioSettings[option.key]}
                    label={t(option.labelKey)}
                    description={t(option.descriptionKey)}
                    onChange={(checked) =>
                      setDraftAudioSettings((current) => ({
                        ...current,
                        [option.key]: checked,
                      }))
                    }
                  />
                ))}
              </div>
              <section className={styles.soundEffectsSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.rangeLabel}>
                    {t('ui.settings.audio.soundEffects.label')}
                  </span>
                  <span className={styles.rangeDescription}>
                    {t('ui.settings.audio.soundEffects.description')}
                  </span>
                </div>
                <div className={styles.switches}>
                  {AUDIO_SETTINGS_SOUND_EFFECT_OPTIONS.map((option) => (
                    <Switch
                      key={option.key}
                      checked={draftAudioSettings.soundEffects[option.key]}
                      label={t(option.labelKey)}
                      description={t(option.descriptionKey)}
                      onChange={(checked) =>
                        setDraftAudioSettings((current) => ({
                          ...current,
                          soundEffects: {
                            ...current.soundEffects,
                            [option.key]: checked,
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </section>
              <label className={styles.rangeField} data-ui-audio-hover="true">
                <span className={styles.rangeHeader}>
                  <span className={styles.rangeLabel}>
                    {t('ui.settings.audio.volume.label')}
                  </span>
                  <span className={styles.rangeValue}>
                    {Math.round(draftAudioSettings.volume * 100)}%
                  </span>
                </span>
                <span className={styles.rangeDescription}>
                  {t('ui.settings.audio.volume.description')}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(draftAudioSettings.volume * 100)}
                  onChange={(event) => {
                    const volume = Number(event.currentTarget.value) / 100;

                    setDraftAudioSettings((current) => ({
                      ...current,
                      volume,
                    }));
                  }}
                />
              </label>
              <div
                className={styles.themeField}
                role="radiogroup"
                aria-label={t('ui.settings.audio.theme.label')}
              >
                <div className={styles.themeHeader}>
                  <span className={styles.rangeLabel}>
                    {t('ui.settings.audio.theme.label')}
                  </span>
                  <span className={styles.rangeDescription}>
                    {t('ui.settings.audio.theme.description')}
                  </span>
                </div>
                <div className={styles.themeOptions}>
                  {AUDIO_THEME_OPTIONS.map((option) => {
                    const selected = draftAudioSettings.theme === option.value;

                    return (
                      <button
                        key={option.value}
                        id={`audio-theme-${option.value}`}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={styles.themeOption}
                        data-active={selected}
                        onClick={() =>
                          setDraftAudioSettings((current) => ({
                            ...current,
                            theme: option.value,
                          }))
                        }
                      >
                        {t(option.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <section className={styles.voiceSection}>
                <label className={styles.selectField}>
                  <span className={styles.sectionHeader}>
                    <span className={styles.rangeLabel}>
                      {t('ui.settings.audio.voice.actor.label')}
                    </span>
                    <span className={styles.rangeDescription}>
                      {t('ui.settings.audio.voice.actor.description')}
                    </span>
                  </span>
                  <select
                    value={draftAudioSettings.voice.actorId}
                    onChange={(event) => {
                      const actorId = event.currentTarget
                        .value as AudioSettings['voice']['actorId'];

                      setDraftAudioSettings((current) => ({
                        ...current,
                        voice: {
                          ...current.voice,
                          actorId,
                        },
                      }));
                    }}
                  >
                    {VOICE_ACTOR_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </label>
                <section className={styles.soundEffectsSection}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.rangeLabel}>
                      {t('ui.settings.audio.voice.events.label')}
                    </span>
                    <span className={styles.rangeDescription}>
                      {t('ui.settings.audio.voice.events.description')}
                    </span>
                  </div>
                  <div className={styles.switches}>
                    {AUDIO_SETTINGS_VOICE_EVENT_OPTIONS.map((option) => (
                      <Switch
                        key={option.key}
                        checked={draftAudioSettings.voice.events[option.key]}
                        label={t(option.labelKey)}
                        description={t(option.descriptionKey)}
                        onChange={(checked) =>
                          setDraftAudioSettings((current) => ({
                            ...current,
                            voice: {
                              ...current.voice,
                              events: {
                                ...current.voice.events,
                                [option.key]: checked,
                              },
                            },
                          }))
                        }
                      />
                    ))}
                  </div>
                </section>
              </section>
            </div>
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
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTabId === tab.id}
            aria-controls={`${tab.id}-panel`}
            className={styles.tab}
            data-active={activeTabId === tab.id}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
