import { Switch } from '@realmfall/ui-react';
import { GAMEPLAY_SETTINGS_TOGGLE_OPTIONS } from '../../../app/gameplaySettings';
import { t } from '../../../i18n';
import type { GameSettingsGameplayPanelProps } from './types';
import styles from './styles.module.scss';

export function GameSettingsGameplayPanel({
  gameplaySettings,
  onChange,
}: GameSettingsGameplayPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.switches}>
        {GAMEPLAY_SETTINGS_TOGGLE_OPTIONS.map((option) => (
          <Switch
            key={option.key}
            checked={gameplaySettings[option.key]}
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
