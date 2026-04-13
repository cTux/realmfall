import { useEffect, useRef, useState } from 'react';
import type { LogWindowProps } from './types';
import styles from './styles.module.css';

const TYPE_DELAY_MS = 16;
const MATRIX_GLYPHS = ['#', '%', '&', '/', '+', '*'];
const LOG_PREFIX_PATTERN = /^\[Day \d+, [0-9]{2}:[0-9]{2}\]\s/;
const BLOOD_MOON_PATTERN = /blood moon/i;
const HARVEST_MOON_PATTERN = /harvest moon/i;

type LogWindowContentProps = Pick<LogWindowProps, 'logs'>;

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

export function LogWindowContent({ logs }: LogWindowContentProps) {
  const orderedLogs = [...logs].reverse();
  const logListRef = useRef<HTMLDivElement | null>(null);
  const newestLogId = orderedLogs[orderedLogs.length - 1]?.id;

  useEffect(() => {
    const list = logListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [newestLogId]);

  return (
    <div ref={logListRef} className={styles.logList}>
      {orderedLogs.map((entry) => (
        <div
          key={entry.id}
          className={`${styles.logEntry} ${styles[entry.kind] ?? ''} ${BLOOD_MOON_PATTERN.test(entry.text) ? styles.bloodMoon : ''} ${HARVEST_MOON_PATTERN.test(entry.text) ? styles.harvestMoon : ''}`.trim()}
        >
          <AnimatedLogLine text={entry.text} />
        </div>
      ))}
    </div>
  );
}
