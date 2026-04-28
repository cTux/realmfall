import { Button } from '@realmfall/ui';
import { t } from '../../../i18n';
import type { TooltipLine } from '../../tooltips';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';
import styles from './styles.module.scss';

export interface VersionStatusWidgetProps extends WindowDetailTooltipHandlers {
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
  onHoverDetail,
  onLeaveDetail,
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
        <Button
          unstyled
          className={styles.refreshButton}
          type="button"
          onMouseEnter={(event) =>
            onHoverDetail?.(
              event,
              t('ui.version.refreshAction'),
              getRefreshTooltipLines({ currentVersion, remoteVersion }),
              'rgba(248, 113, 113, 0.9)',
            )
          }
          onMouseLeave={onLeaveDetail}
          onClick={onRefresh}
        >
          {t('ui.version.refreshAction')}
        </Button>
      ) : null}
    </aside>
  );
}

function getRefreshTooltipLines({
  currentVersion,
  remoteVersion,
}: Pick<VersionStatusWidgetProps, 'currentVersion' | 'remoteVersion'>) {
  return [
    {
      kind: 'text',
      text: t('ui.version.currentValue', { version: currentVersion }),
    },
    {
      kind: 'text',
      text: t('ui.version.remoteValue', {
        version: remoteVersion ?? t('ui.version.fetchingRemoteValue'),
      }),
    },
  ] satisfies TooltipLine[];
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
