import { skillLevelThreshold } from '../../../game/progression';
import type { SkillName } from '../../../game/stateTypes';
import { t } from '../../../i18n';
import { formatSkillLabel } from '../../../i18n/labels';
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
    <div className={styles.content}>
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
                  formatTooltipSkillTitle(name as SkillName),
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
                  {formatSkillLabel(name as SkillName)}
                </span>
                <span className={styles.value}>
                  {t('ui.skills.levelProgress', {
                    level: skill.level,
                    current: skill.xp,
                    max: xpMax,
                  })}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${fill}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function iconMaskStyle(icon: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    WebkitMask: mask,
    mask,
  };
}

function formatTooltipSkillTitle(skill: SkillName) {
  const label = formatSkillLabel(skill);
  if (label.length === 0) return label;
  return label[0].toUpperCase() + label.slice(1);
}
