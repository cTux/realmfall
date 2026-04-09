import { memo } from 'react';
import type { GameTooltipProps } from './types';
import styles from './styles.module.css';

export const GameTooltip = memo(function GameTooltip({
  tooltip,
}: GameTooltipProps) {
  if (!tooltip) return null;

  return (
    <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
      <strong className={styles.title}>{tooltip.title}</strong>
      {tooltip.lines.map((line) => (
        <div
          key={`${tooltip.title}-${line.text}`}
          className={
            line.tone === 'positive'
              ? styles.positive
              : line.tone === 'negative'
                ? styles.negative
                : undefined
          }
        >
          {line.text}
        </div>
      ))}
    </div>
  );
});
