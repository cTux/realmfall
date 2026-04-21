import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { getAbilityDefinition } from '../../../game/abilities';
import { getStatusEffectDefinition } from '../../../game/content/statusEffects';
import type { LogEntry, LogRichSegment } from '../../../game/types';
import { parseWorldCalendarDateTime } from '../../world/timeOfDay';
import { rarityColor } from '../../rarity';
import { statusEffectIcon, statusEffectTint } from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
import { CalendarTimestamp } from '../CalendarTimestamp';
import type { LogWindowProps } from './types';
import styles from './styles.module.scss';

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

const StaticLogLine = memo(function StaticLogLine({
  parsedEntry,
  onHoverDetail,
  onLeaveDetail,
}: {
  parsedEntry: ParsedLogEntry;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
}) {
  const { entry, message, timestampMs } = parsedEntry;

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
      {entry.richText && entry.richText.length > 0
        ? renderRichText(entry.richText, onHoverDetail, onLeaveDetail)
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
  const parsedEntries = useMemo<ParsedLogEntry[]>(
    () => buildParsedLogEntries(logs, parsedEntryCacheRef.current),
    [logs],
  );
  const logListRef = useRef<HTMLDivElement | null>(null);
  const newestEntry = parsedEntries[parsedEntries.length - 1] ?? null;
  const newestLogId = newestEntry?.entry.id;

  useEffect(() => {
    const list = logListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [newestLogId]);

  return (
    <div ref={logListRef} className={styles.logList}>
      {parsedEntries.map((parsedEntry) => {
        return (
          <div key={parsedEntry.entry.id} className={parsedEntry.className}>
            <StaticLogLine
              parsedEntry={parsedEntry}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            />
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

  return {
    entry,
    message: entry.richText?.length
      ? entry.richText.map((segment) => segment.text).join('')
      : message,
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
  segments: LogRichSegment[],
  onHoverDetail?: LogWindowProps['onHoverDetail'],
  onLeaveDetail?: LogWindowProps['onLeaveDetail'],
) {
  return segments.map((segment, index) => {
    if (segment.kind === 'text') {
      return <span key={index}>{segment.text}</span>;
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
          {segment.text}
        </span>
      );
    }

    if (segment.kind === 'damage') {
      return (
        <span key={index} className={styles.damageSegment}>
          {segment.text}
        </span>
      );
    }

    if (segment.kind === 'healing') {
      return (
        <span key={index} className={styles.healingSegment}>
          {segment.text}
        </span>
      );
    }

    return (
      <SourceSegment
        key={index}
        segment={segment}
        visibleText={segment.text}
        fullyVisible
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
