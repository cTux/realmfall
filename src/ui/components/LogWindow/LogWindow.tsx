import { memo, useEffect, useState } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import type { LogWindowProps } from './types';
import styles from './styles.module.css';

const TYPE_DELAY_MS = 16;
const MATRIX_GLYPHS = ['#', '%', '&', '/', '+', '*'];

function AnimatedLogLine({ text }: { text: string }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= text.length) {
          window.clearInterval(intervalId);
          return current;
        }

        return current + 1;
      });
    }, TYPE_DELAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [text]);

  const isComplete = visibleCount >= text.length;
  const cursor = MATRIX_GLYPHS[visibleCount % MATRIX_GLYPHS.length];

  return (
    <span className={styles.logText}>
      {text.slice(0, visibleCount)}
      {isComplete ? null : (
        <span className={styles.logCursor} aria-hidden="true">
          {cursor}
        </span>
      )}
    </span>
  );
}

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
      titleClassName={styles.windowTitle}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
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
      <div className={styles.logList}>
        {logs.map((entry) => (
          <div
            key={entry.id}
            className={`${styles.logEntry} ${styles[entry.kind] ?? ''}`.trim()}
          >
            <span className={styles.logMeta}>
              [{entry.kind}] t{entry.turn}
            </span>
            <AnimatedLogLine text={entry.text} />
          </div>
        ))}
      </div>
    </DraggableWindow>
  );
});
