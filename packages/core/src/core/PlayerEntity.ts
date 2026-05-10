import type { Player } from '../game/types';
import { BattleEntity } from './BattleEntity';
import { Inventory } from './Inventory';

export class PlayerEntity extends BattleEntity<Player> {
  constructor(protected readonly state: Player) {
    super(state, 'player');
  }

  override get label() {
    return 'Player';
  }

  get level() {
    return this.state.level;
  }

  get masteryLevel() {
    return this.state.masteryLevel;
  }

  get xp() {
    return this.state.xp;
  }

  get hunger() {
    return this.state.hunger;
  }

  get thirst() {
    return this.state.thirst ?? 0;
  }

  get mana() {
    return this.state.mana;
  }

  get maxMana() {
    return this.state.baseMaxMana;
  }

  get inventory() {
    return new Inventory(this.state.inventory);
  }

  get inventorySize() {
    return this.state.inventory.length;
  }
}
