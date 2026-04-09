import type { TooltipLine } from '../tooltips';
import styles from './GameTooltip.module.css';

interface GameTooltipProps {
  tooltip: {
    title: string;
    lines: TooltipLine[];
    x: number;
    y: number;
  } | null;
}

export function GameTooltip({ tooltip }: GameTooltipProps) {
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
}
