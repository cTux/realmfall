import type { Enemy } from '../game/types';
import { BattleEntity } from './BattleEntity';

export class EnemyEntity extends BattleEntity<Enemy> {
  constructor(protected readonly state: Enemy) {
    super(state, 'enemy');
  }

  get rarity() {
    return this.state.rarity;
  }

  get enemyTypeId() {
    return this.state.enemyTypeId;
  }

  get isElite() {
    return Boolean(this.state.elite);
  }

  get isWorldBoss() {
    return Boolean(this.state.worldBoss);
  }
}
