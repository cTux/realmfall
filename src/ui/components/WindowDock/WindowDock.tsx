import { memo, useState } from 'react';
import type { WindowVisibilityState } from '../../../app/constants';
import type { WindowLabelDefinition } from '../windowLabels';
import { renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import styles from './styles.module.css';

export interface WindowDockEntry {
  key: keyof WindowVisibilityState;
  label: string;
  title: WindowLabelDefinition;
  icon: string;
  shown: boolean;
}

interface WindowDockProps {
  entries: WindowDockEntry[];
  onToggle: (key: keyof WindowVisibilityState) => void;
}

export const WindowDock = memo(function WindowDock({
  entries,
  onToggle,
}: WindowDockProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <aside className={styles.dock} aria-label="Window dock">
      {entries.map((entry) => (
        <button
          key={entry.key}
          type="button"
          className={styles.dockButton}
          data-opened={entry.shown}
          aria-pressed={entry.shown}
          aria-label={`Toggle ${entry.label} window`}
          onClick={() => onToggle(entry.key)}
          onPointerEnter={() => setActiveTooltip(entry.key)}
          onPointerLeave={() =>
            setActiveTooltip((current) =>
              current === entry.key ? null : current,
            )
          }
          onFocus={() => setActiveTooltip(entry.key)}
          onBlur={() =>
            setActiveTooltip((current) =>
              current === entry.key ? null : current,
            )
          }
        >
          <span
            className={styles.buttonIcon}
            style={iconMaskStyle(entry.icon)}
            aria-hidden="true"
          />
          {activeTooltip === entry.key ? (
            <span className={styles.tooltip} aria-hidden="true">
              {renderWindowLabel(entry.title, labelStyles.hotkey)}
            </span>
          ) : null}
        </button>
      ))}
    </aside>
  );
});

function iconMaskStyle(icon: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    WebkitMask: mask,
    mask,
  };
}
