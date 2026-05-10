import type { Item } from '../game/types';
import { EventEmitter } from './EventEmitter';
import { ItemStack } from './ItemStack';

export class Inventory extends EventEmitter {
  constructor(private readonly state: Item[]) {
    super();
  }

  get items() {
    return this.state.map((item) => new ItemStack(item));
  }

  get size() {
    return this.state.length;
  }

  get isEmpty() {
    return this.state.length === 0;
  }

  get totalQuantity() {
    return this.state.reduce((sum, item) => sum + item.quantity, 0);
  }

  findById(itemId: string) {
    const item = this.state.find((candidate) => candidate.id === itemId);
    return item ? new ItemStack(item) : null;
  }

  findByKey(itemKey: string) {
    const item = this.state.find((candidate) => candidate.itemKey === itemKey);
    return item ? new ItemStack(item) : null;
  }

  snapshot(): Item[] {
    return this.state;
  }
}
