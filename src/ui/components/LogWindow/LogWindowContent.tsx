import { useEffect, useRef, useState } from 'react';
import { parseWorldCalendarDateTime } from '../../world/timeOfDay';
import { CalendarTimestamp } from '../CalendarTimestamp';
import type { LogWindowProps } from './types';
import styles from './styles.module.scss';

const TYPE_DELAY_MS = 32;
const TYPE_STEP = 2;
const MATRIX_GLYPHS = ['#', '%', '&', '/', '+', '*'];
const LOG_PREFIX_PATTERN = /^\[(Year \d+, Day \d+, [0-9]{2}:[0-9]{2})\]\s/;
const BLOOD_MOON_PATTERN = /blood moon/i;
const HARVEST_MOON_PATTERN = /harvest moon/i;

type LogWindowContentProps = Pick<
  LogWindowProps,
  'logs' | 'onHoverDetail' | 'onLeaveDetail'
>;

function splitLogEntry(text: string) {
  const match = text.match(LOG_PREFIX_PATTERN);
  const fullTimestamp = match?.[1] ?? null;
  const message = text.slice(match?.[0].length ?? 0);

  return {
    fullTimestamp,
    timestampMs: fullTimestamp
      ? parseWorldCalendarDateTime(fullTimestamp)
      : null,
    message,
  };
}

function AnimatedLogLine({
  timestampMs,
  text,
  visibleCount,
  onHoverDetail,
  onLeaveDetail,
}: {
  timestampMs: number | null;
  text: string;
  visibleCount: number;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
}) {
  const { message } = splitLogEntry(text);
  const isComplete = visibleCount >= message.length;
  const cursor = MATRIX_GLYPHS[visibleCount % MATRIX_GLYPHS.length];

  return (
    <span className={styles.logText}>
      {timestampMs != null ? (
        <>
          <CalendarTimestamp
            timestampMs={timestampMs}
            display="time"
            className={styles.logTimestamp}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          />{' '}
        </>
      ) : null}
      {message.slice(0, visibleCount)}
      {isComplete ? null : (
        <span className={styles.logCursor} aria-hidden="true">
          {cursor}
        </span>
      )}
    </span>
  );
}

export function LogWindowContent({
  logs,
  onHoverDetail,
  onLeaveDetail,
}: LogWindowContentProps) {
  const orderedLogs = [...logs].reverse();
  const logListRef = useRef<HTMLDivElement | null>(null);
  const newestLogId = orderedLogs[orderedLogs.length - 1]?.id;
  const newestLogText = orderedLogs[orderedLogs.length - 1]?.text ?? '';
  const newestMessage = splitLogEntry(newestLogText).message;
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const list = logListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [newestLogId]);

  useEffect(() => {
    setVisibleCount(0);

    if (newestMessage.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= newestMessage.length) {
          window.clearInterval(intervalId);
          return current;
        }

        return Math.min(current + TYPE_STEP, newestMessage.length);
      });
    }, TYPE_DELAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [newestLogId, newestMessage.length]);

  return (
    <div ref={logListRef} className={styles.logList}>
      {orderedLogs.map((entry) => {
        const { timestampMs } = splitLogEntry(entry.text);

        return (
          <div
            key={entry.id}
            className={`${styles.logEntry} ${styles[entry.kind] ?? ''} ${BLOOD_MOON_PATTERN.test(entry.text) ? styles.bloodMoon : ''} ${HARVEST_MOON_PATTERN.test(entry.text) ? styles.harvestMoon : ''}`.trim()}
          >
            <AnimatedLogLine
              timestampMs={timestampMs}
              text={entry.text}
              visibleCount={
                entry.id === newestLogId
                  ? visibleCount
                  : Number.POSITIVE_INFINITY
              }
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            />
          </div>
        );
      })}
    </div>
  );
}
