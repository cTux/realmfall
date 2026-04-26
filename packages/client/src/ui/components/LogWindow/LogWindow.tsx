import { t } from '../../../i18n';
import { formatLogKindLabel } from '../../../i18n/labels';
import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import type { LogWindowProps } from './types';
import styles from './styles.module.scss';

type LogWindowContentProps = Parameters<
  (typeof import('./LogWindowContent'))['LogWindowContent']
>[0];

export const LogWindow = createDeferredWindowComponent<
  LogWindowProps,
  LogWindowContentProps
>({
  displayName: 'LogWindow',
  loadContent: () =>
    import('./LogWindowContent').then((module) => ({
      default: module.LogWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    onClose,
    filters,
    defaultFilters,
    showFilterMenu,
    onToggleMenu,
    onToggleFilter,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: WINDOW_LABELS.log.plain,
    hotkeyLabel: WINDOW_LABELS.log,
    position,
    onMove,
    className: styles.window,
    titleClassName: styles.windowTitle,
    visible,
    externalUnmount: true,
    onClose,
    resizeBounds: { minWidth: 360, minHeight: 240 },
    onHoverDetail,
    onLeaveDetail,
    headerActions: (
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
                  onChange={() => onToggleFilter(kind as keyof typeof filters)}
                />
                {formatLogKindLabel(kind as keyof typeof filters)}
              </label>
            ))}
          </div>
        ) : null}
      </div>
    ),
  }),
  mapContentProps: ({ logs, onHoverDetail, onLeaveDetail }) => ({
    logs,
    onHoverDetail,
    onLeaveDetail,
  }),
});
