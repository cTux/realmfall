import {
  INTERFACE_FONT_OPTIONS,
  type InterfaceFontFamily,
  resolveInterfaceFontStack,
} from '../../../app/interfaceFonts';
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
      <label className={styles.selectField}>
        <span className={styles.sectionHeader}>
          <span className={styles.rangeLabel}>
            {t('ui.settings.interface.fontFamily.label')}
          </span>
          <span className={styles.rangeDescription}>
            {t('ui.settings.interface.fontFamily.description')}
          </span>
        </span>
        <select
          value={interfaceSettings.fontFamily}
          style={{
            fontFamily: resolveInterfaceFontStack(interfaceSettings.fontFamily),
          }}
          onChange={(event) => {
            const fontFamily = event.currentTarget.value as InterfaceFontFamily;

            onChange((current) => ({
              ...current,
              fontFamily,
            }));
          }}
        >
          {INTERFACE_FONT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </label>
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
