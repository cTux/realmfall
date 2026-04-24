import { t } from '../../../i18n';
import styles from './styles.module.scss';

export interface VersionStatusWidgetProps {
  currentVersion: string;
  onRefresh: () => void;
  remoteVersion: string | null;
  status: 'fetching' | 'current' | 'outdated';
}

type VersionStatusLabelInput = Pick<
  VersionStatusWidgetProps,
  'currentVersion' | 'remoteVersion' | 'status'
>;

export function VersionStatusWidget({
  currentVersion,
  onRefresh,
  remoteVersion,
  status,
}: VersionStatusWidgetProps) {
  const statusLabel = getStatusLabel({
    currentVersion,
    remoteVersion,
    status,
  });

  return (
    <aside
      className={styles.widget}
      aria-live="polite"
      aria-label={statusLabel}
      data-version-status={status}
    >
      <span
        aria-hidden="true"
        className={styles.indicator}
        data-status={status}
      />
      <span className={styles.statusText}>{statusLabel}</span>
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

function getStatusLabel({
  currentVersion,
  remoteVersion,
  status,
}: VersionStatusLabelInput) {
  if (status === 'fetching') {
    return t('ui.version.fetchingStatus', {
      version: currentVersion,
    });
  }

  return status === 'current'
    ? t('ui.version.currentStatus', {
        currentVersion,
        remoteVersion: remoteVersion ?? currentVersion,
      })
    : t('ui.version.outdatedStatus', {
        currentVersion,
        remoteVersion: remoteVersion ?? t('ui.version.fetchingRemoteValue'),
      });
}
