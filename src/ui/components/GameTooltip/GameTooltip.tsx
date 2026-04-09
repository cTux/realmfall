import { memo } from 'react';
import type { GameTooltipProps } from './types';
import styles from './styles.module.css';

export const GameTooltip = memo(function GameTooltip({
  tooltip,
}: GameTooltipProps) {
  if (!tooltip) return null;

  return (
    <div
      className={styles.tooltip}
      style={{
        left: tooltip.x,
        top: tooltip.y,
        borderColor: tooltip.borderColor,
      }}
    >
      <strong className={styles.title}>{tooltip.title}</strong>
      {tooltip.lines.map((line, index) => {
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
              key={`${tooltip.title}-${line.label ?? 'bar'}-${index}`}
              className={styles.barBlock}
            >
              <div className={styles.statRow}>
                <span>{line.label}</span>
                <span>
                  {line.current}/{line.max}
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
              key={`${tooltip.title}-${line.label}-${index}`}
              className={`${styles.statRow} ${className ?? ''}`.trim()}
            >
              <span>{line.label}</span>
              <span>{line.value}</span>
            </div>
          );
        }

        return (
          <div
            key={`${tooltip.title}-${line.text ?? index}`}
            className={className}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
});
