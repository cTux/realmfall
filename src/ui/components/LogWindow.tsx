import type { WindowPosition } from '../../app/constants';
import type { LogEntry, LogKind } from '../../game/state';
import { DraggableWindow } from './DraggableWindow';
import styles from './LogWindow.module.css';

interface LogWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  filters: Record<LogKind, boolean>;
  defaultFilters: Record<LogKind, boolean>;
  showFilterMenu: boolean;
  onToggleMenu: () => void;
  onToggleFilter: (kind: LogKind) => void;
  logs: LogEntry[];
}

export function LogWindow({
  position,
  onMove,
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
                  checked={filters[kind as LogKind]}
                  onChange={() => onToggleFilter(kind as LogKind)}
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
}
