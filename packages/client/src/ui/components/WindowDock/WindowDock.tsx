import { memo, useState, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@realmfall/ui';
import { useUiAudio } from '../../../app/audio/UiAudioContext';
import type { WindowVisibilityState } from '../../../app/constants';
import { t } from '../../../i18n';
import type { WindowLabelDefinition } from '../../windowLabels';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import labelStyles from '../windowLabels.module.scss';
import styles from './styles.module.scss';

export interface WindowDockEntry {
  key: keyof WindowVisibilityState;
  label: string;
  title: WindowLabelDefinition;
  icon: string;
  shown: boolean;
  requiresAttention?: boolean;
  align?: 'start' | 'end';
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
  const startEntries = entries.filter((entry) => entry.align !== 'end');
  const endEntries = entries.filter((entry) => entry.align === 'end');

  return (
    <aside className={styles.dock} aria-label={t('ui.dock.ariaLabel')}>
      <div className={styles.group}>
        {startEntries.map((entry) => (
          <DockButton
            key={entry.key}
            entry={entry}
            activeTooltip={activeTooltip}
            onToggle={onToggle}
            setActiveTooltip={setActiveTooltip}
          />
        ))}
      </div>
      {endEntries.length > 0 ? (
        <div className={styles.group} data-align="end">
          {endEntries.map((entry) => (
            <DockButton
              key={entry.key}
              entry={entry}
              activeTooltip={activeTooltip}
              onToggle={onToggle}
              setActiveTooltip={setActiveTooltip}
            />
          ))}
        </div>
      ) : null}
    </aside>
  );
});

interface DockButtonProps {
  entry: WindowDockEntry;
  activeTooltip: string | null;
  onToggle: (key: keyof WindowVisibilityState) => void;
  setActiveTooltip: Dispatch<SetStateAction<string | null>>;
}

function DockButton({
  entry,
  activeTooltip,
  onToggle,
  setActiveTooltip,
}: DockButtonProps) {
  const audio = useUiAudio();

  return (
    <Button
      unstyled
      type="button"
      className={styles.dockButton}
      data-opened={entry.shown}
      data-attention={entry.requiresAttention}
      data-ui-audio-click="off"
      aria-pressed={entry.shown}
      aria-label={
        entry.requiresAttention
          ? `${t('ui.dock.toggleWindow', { label: entry.label })} ${t(
              'ui.dock.requiresAttention',
            )}`
          : t('ui.dock.toggleWindow', { label: entry.label })
      }
      onClick={(event) => {
        setActiveTooltip(null);
        onToggle(entry.key);
        if (entry.shown) {
          event.currentTarget.blur();
          audio.swoosh();
          return;
        }

        event.currentTarget.blur();
        audio.pop();
      }}
      onPointerEnter={() => setActiveTooltip(entry.key)}
      onPointerLeave={() =>
        setActiveTooltip((current) => (current === entry.key ? null : current))
      }
      onFocus={() => setActiveTooltip(entry.key)}
      onBlur={() =>
        setActiveTooltip((current) => (current === entry.key ? null : current))
      }
    >
      <span
        className={styles.buttonIcon}
        style={iconMaskStyle(entry.icon)}
        aria-hidden="true"
      />
      {entry.requiresAttention ? (
        <span className={styles.attentionBadge} aria-hidden="true" />
      ) : null}
      {activeTooltip === entry.key ? (
        <span className={styles.tooltip} aria-hidden="true">
          <WindowLabel
            label={entry.title}
            hotkeyClassName={labelStyles.hotkey}
          />
        </span>
      ) : null}
    </Button>
  );
}

function iconMaskStyle(icon: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    WebkitMask: mask,
    mask,
  };
}
