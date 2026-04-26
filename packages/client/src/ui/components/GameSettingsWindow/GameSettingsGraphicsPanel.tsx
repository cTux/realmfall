import {
  applyGraphicsPreset,
  GRAPHICS_PRESET_OPTIONS,
  GRAPHICS_SETTINGS_OPTIONS,
  MAX_WORLD_RENDER_FPS,
  MIN_WORLD_RENDER_FPS,
  WORLD_RENDER_FPS_STEP,
  normalizeWorldRenderFps,
} from '../../../app/graphicsSettings';
import { t } from '../../../i18n';
import { Switch } from '../Switch';
import type { GameSettingsGraphicsPanelProps } from './types';
import styles from './styles.module.scss';

export function GameSettingsGraphicsPanel({
  graphicsSettings,
  onChange,
}: GameSettingsGraphicsPanelProps) {
  const reloadRequiredText = t('ui.settings.graphics.reloadRequired');

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
                  {formatGraphicsSettingDescription(
                    t(option.descriptionKey),
                    option.reloadRequired,
                    reloadRequiredText,
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <label className={styles.rangeField}>
        <span className={styles.rangeHeader}>
          <span className={styles.rangeLabel}>
            {t('ui.settings.graphics.worldRenderFps.label')}
          </span>
          <span className={styles.rangeValue}>
            {t('ui.settings.graphics.worldRenderFps.value', {
              fps: graphicsSettings.worldRenderFps,
            })}
          </span>
        </span>
        <span className={styles.rangeDescription}>
          {t('ui.settings.graphics.worldRenderFps.description')}
        </span>
        <input
          type="range"
          min={MIN_WORLD_RENDER_FPS}
          max={MAX_WORLD_RENDER_FPS}
          step={WORLD_RENDER_FPS_STEP}
          value={graphicsSettings.worldRenderFps}
          onChange={(event) => {
            const worldRenderFps = normalizeWorldRenderFps(
              Number(event.currentTarget.value),
            );

            onChange((current) => ({
              ...current,
              worldRenderFps,
            }));
          }}
        />
      </label>
      <div className={styles.switches}>
        {GRAPHICS_SETTINGS_OPTIONS.map((option) => (
          <Switch
            key={option.key}
            checked={graphicsSettings[option.key]}
            label={t(option.labelKey)}
            description={formatGraphicsSettingDescription(
              t(option.descriptionKey),
              option.reloadRequired,
              reloadRequiredText,
            )}
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

function formatGraphicsSettingDescription(
  description: string,
  reloadRequired: boolean | undefined,
  reloadRequiredText: string,
) {
  return reloadRequired ? `${description} ${reloadRequiredText}` : description;
}
