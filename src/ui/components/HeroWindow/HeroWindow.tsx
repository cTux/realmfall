import { memo } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import { StatBar } from './components/StatBar';
import type { HeroWindowProps } from './types';
import styles from './styles.module.css';

export const HeroWindow = memo(function HeroWindow({
  position,
  onMove,
  visible,
  onClose,
  stats,
  hunger,
}: HeroWindowProps) {
  return (
    <DraggableWindow
      title={renderWindowLabel(
        WINDOW_LABELS.hero,
        labelStyles.hotkey,
        <>
          {' '}
          {' · Lv '}
          {stats.level}
          {stats.masteryLevel > 0 ? ` (${stats.masteryLevel})` : ''}
        </>,
      )}
      position={position}
      onMove={onMove}
      visible={visible}
      onClose={onClose}
    >
      <div className={styles.stats}>
        <StatBar label="HP" value={stats.hp} max={stats.maxHp} color="hp" />
        <StatBar
          label="Mana"
          value={stats.mana}
          max={stats.maxMana}
          color="mana"
        />
        <StatBar
          label="XP"
          value={stats.xp}
          max={stats.nextLevelXp}
          color="xp"
        />
        <StatBar label="Hunger" value={hunger} max={100} color="hunger" />
        <div className={styles.heroNumbers}>
          Atk {stats.attack} Def {stats.defense}
        </div>
        <div
          className={`${styles.hungerPenalty} ${stats.hungerPenalty > 0 ? styles.activePenalty : ''}`.trim()}
        >
          Hunger penalty:{' '}
          {stats.hungerPenalty > 0
            ? `-${stats.hungerPenalty} Atk / -${stats.hungerPenalty} Def`
            : 'None'}
        </div>
      </div>
    </DraggableWindow>
  );
});
