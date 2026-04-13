import styles from './WindowLoadingState.module.scss';
import { t } from '../../i18n';

export function WindowLoadingState() {
  return (
    <div
      className={styles.loadingState}
      aria-live="polite"
      aria-busy="true"
      aria-label={t('ui.loading.window')}
    >
      <div className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
