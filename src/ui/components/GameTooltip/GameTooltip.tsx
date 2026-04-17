import { memo, useEffect, useRef, useState } from 'react';
import { formatCompactNumber, formatCompactNumberish } from '../../formatters';
import type { GameTooltipProps, RenderedTooltipState } from './types';
import {
  setFollowCursorTooltipElement,
  syncFollowCursorTooltipPosition,
} from './followCursorSync';
import styles from './styles.module.scss';

function tooltipContentKey(tooltip: GameTooltipProps['tooltip']) {
  if (!tooltip) return null;
  if (tooltip.contentKey) return tooltip.contentKey;

  return JSON.stringify({
    title: tooltip.title,
    lines: tooltip.lines,
    borderColor: tooltip.borderColor ?? null,
  });
}

function isSubtitleLine(text?: string) {
  return Boolean(text && /\b(TIER|LEVEL)\b/.test(text));
}

export const GameTooltip = memo(function GameTooltip({
  tooltip,
  positionRef,
}: GameTooltipProps) {
  const [rendered, setRendered] = useState<RenderedTooltipState | null>(
    tooltip ? { tooltip, visible: true } : null,
  );
  const lastContentKeyRef = useRef<string | null>(tooltipContentKey(tooltip));
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (tooltip) {
      const nextContentKey = tooltipContentKey(tooltip);

      if (nextContentKey === lastContentKeyRef.current) {
        setRendered((current) =>
          !current
            ? { tooltip, visible: true }
            : current.tooltip.x === tooltip.x &&
                current.tooltip.y === tooltip.y &&
                current.tooltip.placement === tooltip.placement &&
                current.tooltip.borderColor === tooltip.borderColor
              ? current
              : { tooltip, visible: current.visible },
        );
        return;
      }

      lastContentKeyRef.current = nextContentKey;

      setRendered({ tooltip, visible: false });
      const frame = window.requestAnimationFrame(() => {
        setRendered({ tooltip, visible: true });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    lastContentKeyRef.current = null;
    setRendered((current) =>
      current ? { tooltip: current.tooltip, visible: false } : null,
    );
    const timeout = window.setTimeout(() => setRendered(null), 140);
    return () => window.clearTimeout(timeout);
  }, [tooltip]);

  useEffect(() => {
    if (!rendered?.tooltip.followCursor || !positionRef) return;
    const element = tooltipRef.current;
    setFollowCursorTooltipElement(element);
    syncFollowCursorTooltipPosition(positionRef.current);

    return () => {
      if (element) {
        setFollowCursorTooltipElement(null);
      }
    };
  }, [positionRef, rendered]);

  if (!rendered) return null;

  const displayPosition =
    rendered.tooltip.followCursor && positionRef?.current
      ? positionRef.current
      : rendered.tooltip;

  return (
    <div
      ref={tooltipRef}
      className={styles.tooltip}
      data-tooltip-visible={rendered.visible}
      style={{
        left: displayPosition.x,
        top: displayPosition.y,
        transform:
          rendered.tooltip.placement === 'left'
            ? 'translateX(-100%)'
            : undefined,
      }}
    >
      <strong
        className={styles.title}
        style={
          rendered.tooltip.borderColor
            ? { color: rendered.tooltip.borderColor }
            : undefined
        }
      >
        {rendered.tooltip.title}
      </strong>
      {rendered.tooltip.lines.map((line, index) => {
        const className =
          line.tone === 'section'
            ? styles.sectionLabel
            : line.tone === 'item'
              ? styles.item
              : line.tone === 'subtle'
                ? styles.subtle
                : line.tone === 'positive'
                  ? styles.positive
                  : line.tone === 'negative'
                    ? styles.negative
                    : undefined;

        if (
          line.kind === 'bar' &&
          typeof line.current === 'number' &&
          typeof line.max === 'number'
        ) {
          const fill =
            line.max > 0
              ? Math.max(0, Math.min(100, (line.current / line.max) * 100))
              : 0;
          return (
            <div
              key={`${rendered.tooltip.title}-${line.label ?? 'bar'}-${index}`}
              className={styles.barBlock}
            >
              <div className={styles.statRow}>
                <span>{line.label}</span>
                <span>
                  {formatCompactNumber(line.current)}/
                  {formatCompactNumber(line.max)}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${fill}%` }} />
              </div>
            </div>
          );
        }

        if (line.kind === 'stat' && line.label) {
          return (
            <div
              key={`${rendered.tooltip.title}-${line.label}-${index}`}
              className={`${styles.statRow} ${className ?? ''}`.trim()}
            >
              <span className={styles.statLabel}>
                {line.icon ? (
                  line.iconTint ? (
                    <span
                      aria-hidden="true"
                      className={styles.statIconMask}
                      style={iconMaskStyle(line.icon, line.iconTint)}
                    />
                  ) : (
                    <img
                      src={line.icon}
                      alt=""
                      aria-hidden="true"
                      className={styles.statIcon}
                    />
                  )
                ) : null}
                <span>{line.label}</span>
              </span>
              <span>{formatCompactNumberish(line.value ?? '')}</span>
            </div>
          );
        }

        return (
          <div
            key={`${rendered.tooltip.title}-${line.text ?? index}`}
            className={
              isSubtitleLine(line.text)
                ? styles.subtitle
                : (className ?? undefined)
            }
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
});

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
