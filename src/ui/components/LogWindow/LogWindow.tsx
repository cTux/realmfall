import { lazy, memo, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { LogWindowProps } from './types';
import styles from './styles.module.css';

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
      title={renderWindowLabel(WINDOW_LABELS.log, labelStyles.hotkey)}
      position={position}
      onMove={onMove}
      className={styles.window}
      titleClassName={styles.windowTitle}
      visible={visible}
      onClose={onClose}
      headerActions={
        <div className={styles.toolbar}>
          <button className={styles.headerButton} onClick={onToggleMenu}>
            Filters
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
                  {kind}
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
