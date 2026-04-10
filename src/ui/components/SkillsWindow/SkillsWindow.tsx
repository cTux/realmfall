import { memo } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { SkillsWindowProps } from './types';
import styles from './styles.module.css';

export const SkillsWindow = memo(function SkillsWindow({
  position,
  onMove,
  visible,
  onClose,
  skills,
}: SkillsWindowProps) {
  return (
    <DraggableWindow
      title={renderWindowLabel(WINDOW_LABELS.skills, labelStyles.hotkey)}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
    >
      <div className={styles.note}>
        Gathering level equals the percent chance to pull +1 extra resource.
      </div>
      <div className={styles.list}>
        {Object.entries(skills).map(([name, skill]) => {
          const xpMax = 5 + skill.level * 3;
          const fill = Math.max(0, Math.min(100, (skill.xp / xpMax) * 100));

          return (
            <div key={name} className={styles.skillRow}>
              <div className={styles.header}>
                <span className={styles.name}>{name}</span>
                <span className={styles.value}>
                  Lv {skill.level} · {skill.xp}/{xpMax}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${fill}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </DraggableWindow>
  );
});
