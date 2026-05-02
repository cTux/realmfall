import { INTERFACE_SETTINGS_RANGE_OPTIONS } from '../../../app/interfaceSettings';
import { t } from '../../../i18n';
import type { GameSettingsInterfacePanelProps } from './types';
import styles from './styles.module.scss';

export function GameSettingsInterfacePanel({
  interfaceSettings,
  onChange,
}: GameSettingsInterfacePanelProps) {
  return (
    <div className={styles.panel}>
      {INTERFACE_SETTINGS_RANGE_OPTIONS.map((option) => (
        <label className={styles.rangeField} key={option.key}>
          <span className={styles.rangeHeader}>
            <span className={styles.rangeLabel}>{t(option.labelKey)}</span>
            <span className={styles.rangeValue}>
              {t('ui.settings.interface.windowTransparency.value', {
                value: interfaceSettings[option.key],
              })}
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
            value={interfaceSettings[option.key]}
            onChange={(event) => {
              const windowTransparency = Number(event.currentTarget.value);

              onChange((current) => ({
                ...current,
                windowTransparency,
              }));
            }}
          />
        </label>
      ))}
    </div>
  );
}
