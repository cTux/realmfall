import { memo } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import type { LogWindowProps } from './types';
import styles from './styles.module.css';

export const LogWindow = memo(function LogWindow({
  position,
  onMove,
  collapsed,
  onCollapsedChange,
  filters,
  defaultFilters,
  showFilterMenu,
  onToggleMenu,
  onToggleFilter,
  logs,
}: LogWindowProps) {
  return (
    <DraggableWindow
      title="Log"
      position={position}
      onMove={onMove}
      className={styles.window}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <div className={styles.toolbar}>
        <button onClick={onToggleMenu}>Filters</button>
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
                {kind}
              </label>
            ))}
          </div>
        ) : null}
      </div>
      <div className={styles.logList}>
        {logs.map((entry) => (
          <div
            key={entry.id}
            className={`${styles.logEntry} ${styles[entry.kind] ?? ''}`.trim()}
          >
            <span className={styles.logMeta}>
              [{entry.kind}] t{entry.turn}
            </span>
            <span>{entry.text}</span>
          </div>
        ))}
      </div>
    </DraggableWindow>
  );
});
