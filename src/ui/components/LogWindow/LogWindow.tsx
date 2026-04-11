import { memo, useEffect, useRef, useState } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { LogWindowProps } from './types';
import styles from './styles.module.css';

const TYPE_DELAY_MS = 16;
const MATRIX_GLYPHS = ['#', '%', '&', '/', '+', '*'];
const LOG_PREFIX_PATTERN = /^\[Day \d+, [0-9]{2}:[0-9]{2}\]\s/;
const BLOOD_MOON_PATTERN = /blood moon/i;

function AnimatedLogLine({ text }: { text: string }) {
  const prefix = text.match(LOG_PREFIX_PATTERN)?.[0] ?? '';
  const message = text.slice(prefix.length);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= message.length) {
          window.clearInterval(intervalId);
          return current;
        }

        return current + 1;
      });
    }, TYPE_DELAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [message]);

  const isComplete = visibleCount >= message.length;
  const cursor = MATRIX_GLYPHS[visibleCount % MATRIX_GLYPHS.length];

  return (
    <span className={styles.logText}>
      {prefix}
      {message.slice(0, visibleCount)}
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
  visible,
  onClose,
  filters,
  defaultFilters,
  showFilterMenu,
  onToggleMenu,
  onToggleFilter,
  logs,
}: LogWindowProps) {
  const orderedLogs = [...logs].reverse();
  const logListRef = useRef<HTMLDivElement | null>(null);
  const newestLogId = orderedLogs[orderedLogs.length - 1]?.id;

  useEffect(() => {
    const list = logListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [newestLogId]);

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
      <div ref={logListRef} className={styles.logList}>
        {orderedLogs.map((entry) => (
          <div
            key={entry.id}
            className={`${styles.logEntry} ${styles[entry.kind] ?? ''} ${BLOOD_MOON_PATTERN.test(entry.text) ? styles.bloodMoon : ''}`.trim()}
          >
            <AnimatedLogLine text={entry.text} />
          </div>
        ))}
      </div>
    </DraggableWindow>
  );
});
