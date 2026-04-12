import type { CombatWindowProps } from './types';
import styles from './styles.module.css';

type CombatWindowContentProps = Pick<
  CombatWindowProps,
  'combat' | 'enemies' | 'player' | 'onAttack'
>;

export function CombatWindowContent({
  combat,
  enemies,
  player,
  onAttack,
}: CombatWindowContentProps) {
  return (
    <>
      <div className={styles.summary}>
        <div>
          Battle at {combat.coord.q}, {combat.coord.r}
        </div>
        <div>
          HP {player.hp}/{player.maxHp}
        </div>
        <div>
          Atk {player.attack} Def {player.defense}
        </div>
      </div>
      <div className={styles.enemyList}>
        {enemies.map((enemy) => (
          <div key={enemy.id} className={styles.enemyCard}>
            <div className={styles.enemyHeader}>
              <strong>
                {enemy.name} L{enemy.tier}
              </strong>
              {enemy.elite ? <span className={styles.elite}>Elite</span> : null}
            </div>
            <div>
              HP {enemy.hp}/{enemy.maxHp}
            </div>
            <div>
              Atk {enemy.attack} Def {enemy.defense}
            </div>
            <button onClick={() => onAttack(enemy.id)}>Attack</button>
          </div>
        ))}
      </div>
    </>
  );
}
