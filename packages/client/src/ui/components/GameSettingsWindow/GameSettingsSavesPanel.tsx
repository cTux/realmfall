import { Button } from '@realmfall/ui';
import { useUiAudio } from '../../../app/audio/UiAudioContext';
import {
  RESETTABLE_SAVE_AREA_IDS,
  type ResettableSaveAreaId,
} from '../../../persistence/saveAreas';
import { t } from '../../../i18n';
import type { GameSettingsSavesPanelProps } from './types';
import styles from './styles.module.scss';

export function GameSettingsSavesPanel({
  busyAreaId,
  onResetSaveArea,
}: GameSettingsSavesPanelProps) {
  const audio = useUiAudio();

  const handleResetClick = async (areaId: ResettableSaveAreaId) => {
    const areaLabel = t(`ui.settings.saves.areas.${areaId}.label`);

    audio.warning();
    if (
      !window.confirm(
        t('ui.settings.saves.confirm', {
          area: areaLabel,
        }),
      )
    ) {
      return;
    }

    await onResetSaveArea(areaId);
  };

  return (
    <div className={styles.savesPanel}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t('ui.settings.saves.title')}</h3>
        <p className={styles.sectionDescription}>
          {t('ui.settings.saves.description')}
        </p>
      </div>
      <div className={styles.saveAreas}>
        {RESETTABLE_SAVE_AREA_IDS.map((areaId) => (
          <section
            key={areaId}
            className={styles.saveAreaCard}
            data-save-area={areaId}
          >
            <div className={styles.saveAreaCopy}>
              <h4 className={styles.saveAreaTitle}>
                {t(`ui.settings.saves.areas.${areaId}.label`)}
              </h4>
              <p className={styles.saveAreaDescription}>
                {t(`ui.settings.saves.areas.${areaId}.description`)}
              </p>
            </div>
            <Button
              unstyled
              type="button"
              className={styles.saveAreaResetButton}
              disabled={busyAreaId !== null}
              onClick={() => void handleResetClick(areaId)}
            >
              {busyAreaId === areaId
                ? t('ui.settings.saves.actions.resetting')
                : t('ui.settings.saves.actions.reset')}
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
