import {
  applyGraphicsPreset,
  GRAPHICS_PRESET_OPTIONS,
  GRAPHICS_SETTINGS_OPTIONS,
} from '../../../app/graphicsSettings';
import { t } from '../../../i18n';
import { Switch } from '../Switch';
import type { GameSettingsGraphicsPanelProps } from './types';
import styles from './styles.module.scss';

export function GameSettingsGraphicsPanel({
  graphicsSettings,
  onChange,
}: GameSettingsGraphicsPanelProps) {
  return (
    <div className={styles.panel}>
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
            {t(`ui.settings.graphics.preset.${graphicsSettings.preset}.label`)}
          </span>
        </div>
        <span className={styles.rangeDescription}>
          {t('ui.settings.graphics.preset.description')}
        </span>
        <div className={styles.graphicsPresetOptions}>
          {GRAPHICS_PRESET_OPTIONS.map((option) => {
            const selected = graphicsSettings.preset === option.value;

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
                  onChange(() => applyGraphicsPreset(option.value))
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
            checked={graphicsSettings[option.key]}
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
    </div>
  );
}
