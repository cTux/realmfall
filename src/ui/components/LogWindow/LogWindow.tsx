import { memo } from 'react';
import { t } from '../../../i18n';
import { formatLogKindLabel } from '../../../i18n/labels';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import type { LogWindowProps } from './types';
import styles from './styles.module.scss';

const LogWindowContent = createLazyWindowComponent<
  Parameters<(typeof import('./LogWindowContent'))['LogWindowContent']>[0]
>(() =>
  import('./LogWindowContent').then((module) => ({
    default: module.LogWindowContent,
  })),
);

export const LogWindow = memo(function LogWindow({
  position,
  onMove,
  visible,
  onClose,
  filters,
  defaultFilters,
  showFilterMenu,
  onToggleMenu,
  onToggleFilter,
  logs,
  onHoverDetail,
  onLeaveDetail,
}: LogWindowProps) {
  return (
    <DeferredWindowShell
      title={WINDOW_LABELS.log.plain}
      hotkeyLabel={WINDOW_LABELS.log}
      position={position}
      onMove={onMove}
      className={styles.window}
      titleClassName={styles.windowTitle}
      visible={visible}
      externalUnmount
      onClose={onClose}
      resizeBounds={{ minWidth: 360, minHeight: 240 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      headerActions={
        <div className={styles.toolbar}>
          <WindowHeaderActionButton
            className={styles.headerButton}
            onClick={onToggleMenu}
            tooltipTitle={t('ui.log.filtersAction')}
            tooltipLines={[
              { kind: 'text', text: t('ui.tooltip.window.logFilters') },
            ]}
            tooltipBorderColor="rgba(74, 222, 128, 0.9)"
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          >
            {t('ui.log.filtersAction')}
          </WindowHeaderActionButton>
          {showFilterMenu ? (
            <div className={styles.filterMenu}>
              {Object.keys(defaultFilters).map((kind) => (
                <label key={kind} className={styles.filterChip}>
                  <input
                    className={styles.styledCheckbox}
                    type="checkbox"
                    checked={filters[kind as keyof typeof filters]}
                    onChange={() =>
                      onToggleFilter(kind as keyof typeof filters)
                    }
                  />
                  {formatLogKindLabel(kind as keyof typeof filters)}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      }
      content={LogWindowContent}
      contentProps={{ logs, onHoverDetail, onLeaveDetail }}
    />
  );
});
