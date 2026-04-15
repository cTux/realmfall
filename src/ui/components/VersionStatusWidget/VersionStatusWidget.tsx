import { t } from '../../../i18n';
import styles from './styles.module.scss';

export interface VersionStatusWidgetProps {
  currentVersion: string;
  onRefresh: () => void;
  remoteVersion: string | null;
  status: 'fetching' | 'current' | 'outdated';
}

export function VersionStatusWidget({
  currentVersion,
  onRefresh,
  remoteVersion,
  status,
}: VersionStatusWidgetProps) {
  const remoteVersionLabel =
    remoteVersion ?? t('ui.version.fetchingRemoteValue');

  return (
    <aside
      className={styles.widget}
      aria-live="polite"
      data-version-status={status}
    >
      <div className={styles.summary}>
        <span
          aria-hidden="true"
          className={styles.indicator}
          data-status={status}
        />
        <div className={styles.text}>
          <span className={styles.label}>{t('ui.version.label')}</span>
          <span className={styles.value}>
            {t('ui.version.currentValue', { version: currentVersion })}
          </span>
          <span className={styles.remoteValue}>
            {t('ui.version.remoteValue', { version: remoteVersionLabel })}
          </span>
        </div>
      </div>
      {status === 'outdated' ? (
        <button
          className={styles.refreshButton}
          type="button"
          onClick={onRefresh}
        >
          {t('ui.version.refreshAction')}
        </button>
      ) : null}
    </aside>
  );
}
