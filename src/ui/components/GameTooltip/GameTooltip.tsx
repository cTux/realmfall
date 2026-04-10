import { memo, useEffect, useState } from 'react';
import { formatCompactNumber, formatCompactNumberish } from '../../formatters';
import type { GameTooltipProps, RenderedTooltipState } from './types';
import styles from './styles.module.css';

export const GameTooltip = memo(function GameTooltip({
  tooltip,
}: GameTooltipProps) {
  const [rendered, setRendered] = useState<RenderedTooltipState | null>(
    tooltip ? { tooltip, visible: true } : null,
  );

  useEffect(() => {
    if (tooltip) {
      setRendered({ tooltip, visible: false });
      const frame = window.requestAnimationFrame(() => {
        setRendered({ tooltip, visible: true });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setRendered((current) =>
      current ? { tooltip: current.tooltip, visible: false } : null,
    );
    const timeout = window.setTimeout(() => setRendered(null), 140);
    return () => window.clearTimeout(timeout);
  }, [tooltip]);

  if (!rendered) return null;

  return (
    <div
      className={styles.tooltip}
      data-tooltip-visible={rendered.visible}
      style={{
        left: rendered.tooltip.x,
        top: rendered.tooltip.y,
        borderColor: rendered.tooltip.borderColor,
      }}
    >
      <strong className={styles.title}>{rendered.tooltip.title}</strong>
      {rendered.tooltip.lines.map((line, index) => {
        const className =
          line.tone === 'positive'
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
              <span>{line.label}</span>
              <span>{formatCompactNumberish(line.value ?? '')}</span>
            </div>
          );
        }

        return (
          <div
            key={`${rendered.tooltip.title}-${line.text ?? index}`}
            className={className}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
});
