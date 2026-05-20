import type { Enemy, Player } from '../game/types';
import { HexCoord } from './HexCoord';
import { EventEmitter } from './EventEmitter';

export type BattleEntityKind = 'player' | 'enemy';

type EntityPayload = Player | Enemy;

export class BattleEntity<
  TState extends EntityPayload = EntityPayload,
> extends EventEmitter {
  constructor(
    protected readonly state: TState,
    public readonly kind: BattleEntityKind,
  ) {
    super();
  }

  get hp() {
    return this.state.hp;
  }

  get maxHp() {
    return 'maxHp' in this.state
      ? (this.state.maxHp ?? this.state.baseMaxHp)
      : this.state.baseMaxHp;
  }

  get attack() {
    return 'maxHp' in this.state ? this.state.attack : this.state.baseAttack;
  }

  get defense() {
    return 'maxHp' in this.state ? this.state.defense : this.state.baseDefense;
  }

  get id() {
    return 'id' in this.state ? this.state.id : 'player';
  }

  get coord() {
    return new HexCoord(this.state.coord.q, this.state.coord.r);
  }

  get isAlive() {
    return this.state.hp > 0;
  }

  get name() {
    return 'name' in this.state ? this.state.name : 'Player';
  }

  get tier() {
    return 'tier' in this.state ? this.state.tier : this.state.level;
  }

  get label() {
    return this.name;
  }

  get mana() {
    return 'mana' in this.state ? (this.state.mana ?? 0) : this.state.mana;
  }

  get maxMana() {
    return 'baseMaxMana' in this.state
      ? this.state.baseMaxMana
      : (this.state.maxMana ?? 0);
  }

  snapshot(): TState {
    return this.state;
  }
}
