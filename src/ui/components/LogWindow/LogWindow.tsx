import { lazy, memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { formatLogKindLabel } from '../../../i18n/labels';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import labelStyles from '../windowLabels.module.scss';
import type { LogWindowProps } from './types';
import styles from './styles.module.scss';

const LogWindowContent = lazy(() =>
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
}: LogWindowProps) {
  return (
    <DraggableWindow
      title={
        <WindowLabel
          label={WINDOW_LABELS.log}
          hotkeyClassName={labelStyles.hotkey}
        />
      }
      position={position}
      onMove={onMove}
      className={styles.window}
      titleClassName={styles.windowTitle}
      visible={visible}
      onClose={onClose}
      resizeBounds={{ minWidth: 360, minHeight: 240 }}
      headerActions={
        <div className={styles.toolbar}>
          <button className={styles.headerButton} onClick={onToggleMenu}>
            {t('ui.log.filtersAction')}
          </button>
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
    >
      <Suspense fallback={<WindowLoadingState />}>
        <LogWindowContent logs={logs} />
      </Suspense>
    </DraggableWindow>
  );
});
