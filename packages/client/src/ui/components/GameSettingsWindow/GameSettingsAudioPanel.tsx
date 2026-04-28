import { Button, Switch } from '@realmfall/ui';
import {
  AUDIO_SETTINGS_SOUND_EFFECT_OPTIONS,
  AUDIO_SETTINGS_TOGGLE_OPTIONS,
  AUDIO_SETTINGS_VOLUME_OPTIONS,
  AUDIO_SETTINGS_VOICE_EVENT_OPTIONS,
  AUDIO_THEME_OPTIONS,
  type AudioSettings,
} from '../../../app/audioSettings';
import { VOICE_ACTOR_OPTIONS } from '../../../app/audio/voiceActors';
import { t } from '../../../i18n';
import type { GameSettingsAudioPanelProps } from './types';
import styles from './styles.module.scss';

export function GameSettingsAudioPanel({
  audioSettings,
  onChange,
}: GameSettingsAudioPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.switches}>
        {AUDIO_SETTINGS_TOGGLE_OPTIONS.map((option) => (
          <Switch
            key={option.key}
            checked={audioSettings[option.key]}
            label={t(option.labelKey)}
            description={t(option.descriptionKey)}
            onChange={(checked) =>
              onChange((current) => ({
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
              checked={audioSettings.soundEffects[option.key]}
              label={t(option.labelKey)}
              description={t(option.descriptionKey)}
              onChange={(checked) =>
                onChange((current) => ({
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
      {AUDIO_SETTINGS_VOLUME_OPTIONS.map((option) => (
        <label
          className={styles.rangeField}
          key={option.key}
          data-ui-audio-hover="true"
        >
          <span className={styles.rangeHeader}>
            <span className={styles.rangeLabel}>{t(option.labelKey)}</span>
            <span className={styles.rangeValue}>
              {Math.round(audioSettings[option.key] * 100)}%
            </span>
          </span>
          <span className={styles.rangeDescription}>
            {t(option.descriptionKey)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(audioSettings[option.key] * 100)}
            onChange={(event) => {
              const volume = Number(event.currentTarget.value) / 100;

              onChange((current) => ({
                ...current,
                [option.key]: volume,
              }));
            }}
          />
        </label>
      ))}
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
            const selected = audioSettings.theme === option.value;

            return (
              <Button
                unstyled
                key={option.value}
                id={`audio-theme-${option.value}`}
                type="button"
                role="radio"
                aria-checked={selected}
                className={styles.themeOption}
                data-active={selected}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    theme: option.value,
                  }))
                }
              >
                {t(option.labelKey)}
              </Button>
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
            value={audioSettings.voice.actorId}
            onChange={(event) => {
              const actorId = event.currentTarget
                .value as AudioSettings['voice']['actorId'];

              onChange((current) => ({
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
                checked={audioSettings.voice.events[option.key]}
                label={t(option.labelKey)}
                description={t(option.descriptionKey)}
                onChange={(checked) =>
                  onChange((current) => ({
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
  );
}
