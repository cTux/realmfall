import { isPassable } from '../game/shared';
import type { HexCoord as RuntimeHexCoord } from '../game/hex';
import type { Tile as TileState } from '../game/types';
import { EnemyEntity } from './EnemyEntity';
import { EventEmitter } from './EventEmitter';
import { HexCoord } from './HexCoord';
import { ItemStack } from './ItemStack';

interface TileResolvers {
  getEnemies?: (coord: RuntimeHexCoord) => EnemyEntity[];
}

export class Tile extends EventEmitter {
  constructor(
    private readonly state: TileState,
    private readonly resolvers: TileResolvers = {},
  ) {
    super();
  }

  get coord() {
    return HexCoord.from(this.state.coord);
  }

  get terrain() {
    return this.state.terrain;
  }

  get structure() {
    return this.state.structure;
  }

  get structureHp() {
    return this.state.structureHp;
  }

  get structureMaxHp() {
    return this.state.structureMaxHp;
  }

  get claim() {
    return this.state.claim;
  }

  get items() {
    return this.state.items.map((item) => new ItemStack(item));
  }

  get enemyIds() {
    return [...this.state.enemyIds];
  }

  get townStockDay() {
    return this.state.townStockDay;
  }

  get townStockPurchasedItemIds() {
    return this.state.townStockPurchasedItemIds
      ? [...this.state.townStockPurchasedItemIds]
      : undefined;
  }

  get hasClaim() {
    return Boolean(this.state.claim);
  }

  get hasEnemies() {
    return this.state.enemyIds.length > 0;
  }

  get hasItems() {
    return this.state.items.length > 0;
  }

  get hasStructure() {
    return this.state.structure !== undefined;
  }

  get isPassable() {
    return isPassable(this.state.terrain);
  }

  get enemies() {
    return this.resolvers.getEnemies?.(this.state.coord) ?? [];
  }

  snapshot(): TileState {
    return this.state;
  }
}
