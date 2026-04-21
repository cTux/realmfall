import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAbilityDefinition } from '../../../game/abilities';
import { getStatusEffectDefinition } from '../../../game/content/statusEffects';
import type { LogEntry, LogRichSegment } from '../../../game/types';
import { parseWorldCalendarDateTime } from '../../world/timeOfDay';
import { rarityColor } from '../../rarity';
import { statusEffectIcon, statusEffectTint } from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
import { CalendarTimestamp } from '../CalendarTimestamp';
import { createDisplayText, takeVisibleDisplayText } from './displayText';
import type { LogWindowProps } from './types';
import styles from './styles.module.scss';

const TYPE_DELAY_MS = 32;
const TYPE_STEP = 2;
const LOG_PREFIX_PATTERN = /^\[(Year \d+, Day \d+, [0-9]{2}:[0-9]{2})\]\s/;
const BLOOD_MOON_PATTERN = /blood moon/i;
const HARVEST_MOON_PATTERN = /harvest moon/i;

type LogWindowContentProps = Pick<
  LogWindowProps,
  'logs' | 'onHoverDetail' | 'onLeaveDetail'
>;

type ParsedLogEntry = {
  entry: LogEntry;
  message: string;
  messageDisplay: ReturnType<typeof createDisplayText>;
  richTextDisplays: Array<{
    segment: LogRichSegment;
    displayText: ReturnType<typeof createDisplayText>;
  }> | null;
  timestampMs: number | null;
  className: string;
};

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

const AnimatedLogLine = memo(function AnimatedLogLine({
  parsedEntry,
  onTypingProgress,
  onHoverDetail,
  onLeaveDetail,
}: {
  parsedEntry: ParsedLogEntry;
  onTypingProgress?: (visibleCount: number, totalCount: number) => void;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
}) {
  const { entry, messageDisplay, richTextDisplays, timestampMs } = parsedEntry;
  const [visibleCount, setVisibleCount] = useState(0);
  const isComplete = visibleCount >= messageDisplay.units.length;

  useEffect(() => {
    setVisibleCount(0);

    if (messageDisplay.units.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= messageDisplay.units.length) {
          window.clearInterval(intervalId);
          return current;
        }

        return Math.min(current + TYPE_STEP, messageDisplay.units.length);
      });
    }, TYPE_DELAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [entry.id, messageDisplay.units.length]);

  useEffect(() => {
    onTypingProgress?.(visibleCount, messageDisplay.units.length);
  }, [messageDisplay.units.length, onTypingProgress, visibleCount]);

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
      {richTextDisplays
        ? renderRichText(
            richTextDisplays,
            visibleCount,
            onHoverDetail,
            onLeaveDetail,
          )
        : takeVisibleDisplayText(messageDisplay, visibleCount)}
      {isComplete ? null : (
        <span className={styles.logCursor} aria-hidden="true" />
      )}
    </span>
  );
});

const StaticLogLine = memo(function StaticLogLine({
  parsedEntry,
  onHoverDetail,
  onLeaveDetail,
}: {
  parsedEntry: ParsedLogEntry;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
}) {
  const { message, richTextDisplays, timestampMs } = parsedEntry;

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
      {richTextDisplays
        ? renderRichText(
            richTextDisplays,
            Number.POSITIVE_INFINITY,
            onHoverDetail,
            onLeaveDetail,
          )
        : message}
    </span>
  );
});

export function LogWindowContent({
  logs,
  onHoverDetail,
  onLeaveDetail,
}: LogWindowContentProps) {
  const parsedEntryCacheRef = useRef(new WeakMap<LogEntry, ParsedLogEntry>());
  const [newestVisibleCount, setNewestVisibleCount] = useState(0);
  const [newestTotalCount, setNewestTotalCount] = useState(0);
  const parsedEntries = useMemo<ParsedLogEntry[]>(
    () => buildParsedLogEntries(logs, parsedEntryCacheRef.current),
    [logs],
  );
  const logListRef = useRef<HTMLDivElement | null>(null);
  const newestEntry = parsedEntries[parsedEntries.length - 1] ?? null;
  const newestLogId = newestEntry?.entry.id;
  const handleNewestTypingProgress = useCallback(
    (visibleCount: number, totalCount: number) => {
      setNewestVisibleCount(visibleCount);
      setNewestTotalCount(totalCount);
    },
    [],
  );

  useEffect(() => {
    const list = logListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [newestLogId]);

  useEffect(() => {
    const list = logListRef.current;
    if (!list || newestVisibleCount >= newestTotalCount) return;
    list.scrollTop = list.scrollHeight;
  }, [newestTotalCount, newestVisibleCount]);

  return (
    <div ref={logListRef} className={styles.logList}>
      {parsedEntries.map((parsedEntry) => {
        const { entry } = parsedEntry;
        const isNewest = entry.id === newestLogId;
        return (
          <div key={entry.id} className={parsedEntry.className}>
            {isNewest ? (
              <AnimatedLogLine
                parsedEntry={parsedEntry}
                onTypingProgress={handleNewestTypingProgress}
                onHoverDetail={onHoverDetail}
                onLeaveDetail={onLeaveDetail}
              />
            ) : (
              <StaticLogLine
                parsedEntry={parsedEntry}
                onHoverDetail={onHoverDetail}
                onLeaveDetail={onLeaveDetail}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function buildParsedLogEntries(
  logs: LogEntry[],
  cache: WeakMap<LogEntry, ParsedLogEntry>,
) {
  const parsedEntries: ParsedLogEntry[] = [];

  for (let index = logs.length - 1; index >= 0; index -= 1) {
    const entry = logs[index]!;
    const cachedEntry = cache.get(entry);

    if (cachedEntry) {
      parsedEntries.push(cachedEntry);
      continue;
    }

    const parsedEntry = createParsedLogEntry(entry);
    cache.set(entry, parsedEntry);
    parsedEntries.push(parsedEntry);
  }

  return parsedEntries;
}

function createParsedLogEntry(entry: LogEntry): ParsedLogEntry {
  const { timestampMs, message } = splitLogEntry(entry.text);
  const richTextDisplays =
    entry.richText?.map((segment) => ({
      segment,
      displayText: createDisplayText(segment.text),
    })) ?? null;
  const fullMessage = richTextDisplays?.length
    ? richTextDisplays.map(({ displayText }) => displayText.text).join('')
    : message;

  return {
    entry,
    message: fullMessage,
    messageDisplay: createDisplayText(fullMessage),
    richTextDisplays,
    timestampMs,
    className: [
      styles.logEntry,
      styles[entry.kind] ?? '',
      BLOOD_MOON_PATTERN.test(entry.text) ? styles.bloodMoon : '',
      HARVEST_MOON_PATTERN.test(entry.text) ? styles.harvestMoon : '',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

function renderRichText(
  segments: NonNullable<ParsedLogEntry['richTextDisplays']>,
  visibleCount: number,
  onHoverDetail?: LogWindowProps['onHoverDetail'],
  onLeaveDetail?: LogWindowProps['onLeaveDetail'],
) {
  let remaining = visibleCount;

  return segments.map(({ segment, displayText }, index) => {
    if (remaining <= 0) return null;

    const visibleUnits = Math.min(remaining, displayText.units.length);
    const visibleText = takeVisibleDisplayText(displayText, visibleUnits);
    remaining -= visibleUnits;
    if (visibleText.length === 0) return null;

    if (segment.kind === 'text') {
      return <span key={index}>{visibleText}</span>;
    }

    if (segment.kind === 'entity') {
      return (
        <span
          key={index}
          className={styles.entitySegment}
          style={
            segment.rarity ? { color: rarityColor(segment.rarity) } : undefined
          }
        >
          {visibleText}
        </span>
      );
    }

    if (segment.kind === 'damage') {
      return (
        <span key={index} className={styles.damageSegment}>
          {visibleText}
        </span>
      );
    }

    if (segment.kind === 'healing') {
      return (
        <span key={index} className={styles.healingSegment}>
          {visibleText}
        </span>
      );
    }

    return (
      <SourceSegment
        key={index}
        segment={segment}
        visibleText={visibleText}
        fullyVisible={visibleUnits === displayText.units.length}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
    );
  });
}

function SourceSegment({
  segment,
  visibleText,
  fullyVisible,
  onHoverDetail,
  onLeaveDetail,
}: {
  segment: Extract<LogRichSegment, { kind: 'source' }>;
  visibleText: string;
  fullyVisible: boolean;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
}) {
  const tooltip = buildSourceTooltip(segment);

  const handleMouseEnter =
    fullyVisible && tooltip && onHoverDetail
      ? (event: ReactMouseEvent<HTMLElement>) =>
          onHoverDetail(
            event,
            tooltip.title,
            tooltip.lines,
            tooltip.borderColor,
          )
      : undefined;

  return (
    <span
      className={styles.sourceSegment}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseEnter ? onLeaveDetail : undefined}
    >
      <span
        aria-hidden="true"
        className={styles.sourceIcon}
        style={sourceIconStyle(segment)}
      />
      <span>{visibleText}</span>
    </span>
  );
}

function sourceIconStyle(
  segment: Extract<LogRichSegment, { kind: 'source' }>,
): CSSProperties {
  if (segment.source.kind === 'ability') {
    const ability = getAbilityDefinition(segment.source.abilityId);
    return maskStyle(ability.icon, '#f8fafc');
  }

  return maskStyle(
    statusEffectIcon(segment.source.effectId),
    statusEffectTint(
      segment.source.effectId,
      segment.source.tone ??
        (getStatusEffectDefinition(segment.source.effectId)?.tone === 'buff'
          ? 'buff'
          : 'debuff'),
    ),
  );
}

function buildSourceTooltip(
  segment: Extract<LogRichSegment, { kind: 'source' }>,
) {
  if (segment.source.kind === 'ability') {
    const ability = getAbilityDefinition(segment.source.abilityId);
    return {
      title: ability.name,
      lines: abilityTooltipLines(
        ability,
        ability.target,
        segment.source.attack,
      ),
      borderColor: 'rgba(148, 163, 184, 0.9)',
    };
  }

  const tone =
    segment.source.tone ??
    (getStatusEffectDefinition(segment.source.effectId)?.tone === 'buff'
      ? 'buff'
      : 'debuff');

  return {
    title: segment.text,
    lines: statusEffectTooltipLines(segment.source.effectId, tone, [], {
      id: segment.source.effectId,
      value: segment.source.value,
      tickIntervalMs: segment.source.tickIntervalMs,
      stacks: segment.source.stacks,
    }),
    borderColor:
      tone === 'buff' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
  };
}

function maskStyle(icon: string, tint: string): CSSProperties {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: tint,
    WebkitMask: mask,
    mask,
  };
}
