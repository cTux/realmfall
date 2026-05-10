import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getAbilityDefinition } from '@realmfall/core/game/abilities';
import { getStatusEffectDefinition } from '@realmfall/core/game/content/statusEffects';
import type { LogEntry, LogRichSegment } from '@realmfall/core/game/stateTypes';
import { t } from '../../../i18n';
import { ICON_TINT_COLORS } from '../../../theme.config';
import { parseWorldCalendarDateTime } from '../../world/timeOfDay';
import { rarityColor } from '../../rarity';
import { resolveIconAsset } from '../../iconAssets';
import { statusEffectIcon, statusEffectTint } from '../../statusEffects';
import {
  abilityTooltipLines,
  enemyTooltip,
  statusEffectTooltipLines,
} from '../../tooltips';
import { CalendarTimestamp } from '../CalendarTimestamp';
import {
  measureElementWithFallback,
  observeElementRectWithFallback,
  scrollElementToOffset,
} from '../../virtualizer';
import type { LogWindowProps } from './types';
import styles from './styles.module.scss';

const LOG_PREFIX_PATTERN = /^\[(Year \d+, Day \d+, [0-9]{2}:[0-9]{2})\]\s/;
const BLOOD_MOON_PATTERN = /blood moon/i;
const HARVEST_MOON_PATTERN = /harvest moon/i;
const LOG_VIRTUAL_ROW_ESTIMATE = 28;
const LOG_VIRTUAL_INITIAL_RECT = { height: 240, width: 0 };

type LogWindowContentProps = Pick<
  LogWindowProps,
  'logs' | 'showTooltipTags' | 'onHoverDetail' | 'onLeaveDetail'
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
  showTooltipTags,
}: {
  parsedEntry: ParsedLogEntry;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
  showTooltipTags?: boolean;
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
        ? renderRichText(
            entry.richText,
            onHoverDetail,
            onLeaveDetail,
            showTooltipTags,
          )
        : message}
    </span>
  );
});

export function LogWindowContent({
  logs,
  showTooltipTags = true,
  onHoverDetail,
  onLeaveDetail,
}: LogWindowContentProps) {
  const parsedEntryCacheRef = useRef(new WeakMap<LogEntry, ParsedLogEntry>());
  const parsedEntries = useMemo<ParsedLogEntry[]>(
    () => buildParsedLogEntries(logs, parsedEntryCacheRef.current),
    [logs],
  );
  const logListRef = useRef<HTMLDivElement | null>(null);
  const logVirtualizer = useVirtualizer({
    count: parsedEntries.length,
    getScrollElement: () => logListRef.current,
    estimateSize: () => LOG_VIRTUAL_ROW_ESTIMATE,
    overscan: 12,
    getItemKey: (index) => parsedEntries[index]!.entry.id,
    observeElementRect: observeElementRectWithFallback(
      LOG_VIRTUAL_INITIAL_RECT,
    ),
    initialRect: LOG_VIRTUAL_INITIAL_RECT,
    measureElement: measureElementWithFallback(LOG_VIRTUAL_ROW_ESTIMATE),
    scrollToFn: scrollElementToOffset,
    useFlushSync: false,
  });
  const virtualLogItems = logVirtualizer.getVirtualItems();
  const newestEntry = parsedEntries[parsedEntries.length - 1] ?? null;
  const newestLogId = newestEntry?.entry.id;

  useEffect(() => {
    const list = logListRef.current;
    if (!list) return;
    if (list.scrollHeight > 0) {
      list.scrollTop = Math.max(
        list.scrollHeight,
        logVirtualizer.getTotalSize(),
      );
      list.dispatchEvent(new Event('scroll'));
      return;
    }
    if (parsedEntries.length > 0) {
      logVirtualizer.scrollToIndex(parsedEntries.length - 1, {
        align: 'end',
      });
    }
  }, [logVirtualizer, newestLogId, parsedEntries.length]);

  return (
    <div
      ref={logListRef}
      className={styles.logList}
      data-virtualized-list="log-window"
    >
      <div
        className={styles.virtualListBody}
        style={{ height: `${logVirtualizer.getTotalSize()}px` }}
      >
        {virtualLogItems.map((virtualItem) => {
          const parsedEntry = parsedEntries[virtualItem.index]!;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={logVirtualizer.measureElement}
              className={[styles.virtualRow, parsedEntry.className].join(' ')}
              style={virtualRowStyle(virtualItem.start)}
            >
              <StaticLogLine
                parsedEntry={parsedEntry}
                onHoverDetail={onHoverDetail}
                onLeaveDetail={onLeaveDetail}
                showTooltipTags={showTooltipTags}
              />
            </div>
          );
        })}
      </div>
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
  showTooltipTags = true,
) {
  return segments.map((segment, index) => {
    if (segment.kind === 'text') {
      return <span key={index}>{segment.text}</span>;
    }

    if (segment.kind === 'entity') {
      return (
        <EntitySegment
          key={index}
          segment={segment}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
          showTooltipTags={showTooltipTags}
        />
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
        showTooltipTags={showTooltipTags}
      />
    );
  });
}

function EntitySegment({
  segment,
  onHoverDetail,
  onLeaveDetail,
  showTooltipTags,
}: {
  segment: Extract<LogRichSegment, { kind: 'entity' }>;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
  showTooltipTags?: boolean;
}) {
  const tooltip =
    segment.enemy && enemyTooltip([segment.enemy], undefined, showTooltipTags)
      ? {
          ...enemyTooltip([segment.enemy], undefined, showTooltipTags)!,
          borderColor: rarityColor(segment.enemy.rarity ?? 'common'),
        }
      : null;

  const handleMouseEnter =
    tooltip && onHoverDetail
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
      className={styles.entitySegment}
      style={
        segment.rarity ? { color: rarityColor(segment.rarity) } : undefined
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseEnter ? onLeaveDetail : undefined}
    >
      {segment.text}
    </span>
  );
}

function SourceSegment({
  segment,
  visibleText,
  fullyVisible,
  onHoverDetail,
  onLeaveDetail,
  showTooltipTags,
}: {
  segment: Extract<LogRichSegment, { kind: 'source' }>;
  visibleText: string;
  fullyVisible: boolean;
  onHoverDetail?: LogWindowProps['onHoverDetail'];
  onLeaveDetail?: LogWindowProps['onLeaveDetail'];
  showTooltipTags?: boolean;
}) {
  const tooltip = buildSourceTooltip(segment, showTooltipTags);

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
    return maskStyle(resolveIconAsset(ability.icon), ICON_TINT_COLORS.neutral);
  }

  if (segment.source.kind === 'secondaryStat') {
    return maskStyle(
      getSecondaryStatIcon(segment.source.stat),
      ICON_TINT_COLORS.secondaryStat,
    );
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
  showTooltipTags = true,
) {
  if (segment.source.kind === 'ability') {
    const ability = getAbilityDefinition(segment.source.abilityId);
    return {
      title: ability.name,
      lines: abilityTooltipLines(
        ability,
        ability.target,
        segment.source.attack,
        showTooltipTags,
      ),
      borderColor: 'rgba(148, 163, 184, 0.9)',
    };
  }

  if (segment.source.kind === 'secondaryStat') {
    return {
      title: segment.text,
      lines: [
        {
          kind: 'text' as const,
          text: t(`ui.secondaryStat.tooltip.${segment.source.stat}`),
        },
      ],
      borderColor: 'rgba(34, 197, 94, 0.9)',
    };
  }

  const tone =
    segment.source.tone ??
    (getStatusEffectDefinition(segment.source.effectId)?.tone === 'buff'
      ? 'buff'
      : 'debuff');

  return {
    title: segment.text,
    lines: statusEffectTooltipLines(
      segment.source.effectId,
      tone,
      [],
      {
        id: segment.source.effectId,
        value: segment.source.value,
        tickIntervalMs: segment.source.tickIntervalMs,
        stacks: segment.source.stacks,
      },
      undefined,
      showTooltipTags,
    ),
    borderColor:
      tone === 'buff' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
  };
}

function getSecondaryStatIcon(
  stat: Extract<
    Extract<LogRichSegment, { kind: 'source' }>['source'],
    { kind: 'secondaryStat' }
  >['stat'],
) {
  switch (stat) {
    case 'lifestealAmount':
      return resolveIconAsset(
        getStatusEffectDefinition('restoration')?.icon ?? '',
      );
    case 'criticalStrikeChance':
    case 'criticalStrikeDamage':
      return resolveIconAsset(getAbilityDefinition('slash').icon);
    case 'dodgeChance':
      return resolveIconAsset(getAbilityDefinition('hamstring').icon);
    case 'blockChance':
      return resolveIconAsset(getAbilityDefinition('kick').icon);
    case 'suppressDamageChance':
    case 'suppressDamageReduction':
      return resolveIconAsset(getStatusEffectDefinition('guard')?.icon ?? '');
    default:
      return resolveIconAsset(getStatusEffectDefinition('power')?.icon ?? '');
  }
}

function maskStyle(icon: string, tint: string): CSSProperties {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: tint,
    WebkitMask: mask,
    mask,
  };
}

function virtualRowStyle(start: number): CSSProperties {
  return {
    left: 0,
    position: 'absolute',
    top: 0,
    transform: `translateY(${start}px)`,
    width: '100%',
  };
}
