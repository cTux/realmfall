import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './WindowLoadingState.module.scss';

export const WINDOW_LOADING_WARNING_DELAY_MS = 3000;

export function WindowLoadingState() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowWarning(true);
    }, WINDOW_LOADING_WARNING_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div
      className={styles.loadingState}
      aria-live="polite"
      aria-busy="true"
      aria-label={t('ui.loading.window')}
    >
      <LoadingSpinner />
      {showWarning ? (
        <p className={styles.message}>{t('ui.loading.windowDelayed')}</p>
      ) : null}
    </div>
  );
}
