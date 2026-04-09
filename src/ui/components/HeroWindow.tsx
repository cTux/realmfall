import { DraggableWindow } from './DraggableWindow';
import type { WindowPosition } from '../../app/constants';
import styles from './HeroWindow.module.css';

interface HeroWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  stats: {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    xp: number;
    nextLevelXp: number;
    hungerPenalty: number;
    attack: number;
    defense: number;
    level: number;
  };
  hunger: number;
}

export function HeroWindow({
  position,
  onMove,
  stats,
  hunger,
}: HeroWindowProps) {
  return (
    <DraggableWindow
      title={`Hero Info · Lv ${stats.level}`}
      position={position}
      onMove={onMove}
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
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: 'hp' | 'mana' | 'xp' | 'hunger';
}) {
  const width = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={styles.barBlock}>
      <div className={styles.barLabel}>
        <span>{label}</span>
        <strong>
          {value}/{max}
        </strong>
      </div>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${styles[color]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
