import { StatBar } from './components/StatBar';
import type { HeroWindowProps } from './types';
import styles from './styles.module.css';

type HeroWindowContentProps = Pick<HeroWindowProps, 'stats' | 'hunger'>;

export function HeroWindowContent({ stats, hunger }: HeroWindowContentProps) {
  return (
    <div className={styles.stats}>
      <StatBar label="HP" value={stats.hp} max={stats.maxHp} color="hp" />
      <StatBar
        label="Mana"
        value={stats.mana}
        max={stats.maxMana}
        color="mana"
      />
      <StatBar label="XP" value={stats.xp} max={stats.nextLevelXp} color="xp" />
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
  );
}
