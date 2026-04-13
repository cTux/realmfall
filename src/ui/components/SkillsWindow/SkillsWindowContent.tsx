import type { SkillName } from '../../../game/state';
import { skillLevelThreshold } from '../../../game/state';
import { skillTooltip } from '../../tooltips';
import { SkillIcon } from '../../icons';
import type { SkillsWindowProps } from './types';
import styles from './styles.module.scss';

type SkillsWindowContentProps = Pick<
  SkillsWindowProps,
  'skills' | 'onHoverDetail' | 'onLeaveDetail'
>;

export function SkillsWindowContent({
  skills,
  onHoverDetail,
  onLeaveDetail,
}: SkillsWindowContentProps) {
  return (
    <>
      <div className={styles.note}>
        Gathering level equals the percent chance to pull +1 extra resource.
      </div>
      <div className={styles.list}>
        {Object.entries(skills).map(([name, skill]) => {
          const xpMax = skillLevelThreshold(skill.level);
          const fill = Math.max(0, Math.min(100, (skill.xp / xpMax) * 100));
          const tooltipLines = skillTooltip(name as SkillName, skill.level);

          return (
            <div
              key={name}
              className={styles.skillRow}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  name.toUpperCase(),
                  tooltipLines,
                  'rgba(56, 189, 248, 0.9)',
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              <div className={styles.header}>
                <span className={styles.name}>
                  <span
                    className={styles.icon}
                    style={iconMaskStyle(
                      SkillIcon[name as keyof typeof SkillIcon],
                    )}
                  />
                  {name}
                </span>
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
    </>
  );
}

function iconMaskStyle(icon: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    WebkitMask: mask,
    mask,
  };
}
