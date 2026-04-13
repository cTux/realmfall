import { SkillIcon } from '../../icons';
import type { SkillsWindowProps } from './types';
import styles from './styles.module.scss';

type SkillsWindowContentProps = Pick<SkillsWindowProps, 'skills'>;

export function SkillsWindowContent({ skills }: SkillsWindowContentProps) {
  return (
    <>
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
