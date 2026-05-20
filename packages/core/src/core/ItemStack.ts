import type { GameTag } from '../game/content/tags';
import {
  getItemCategory,
  hasItemTag,
  isEquippableItemCategory,
} from '../game/content/items/itemClassification';
import type { Item } from '../game/types';
import { EventEmitter } from './EventEmitter';

export class ItemStack extends EventEmitter {
  constructor(private readonly state: Item) {
    super();
  }

  get id() {
    return this.state.id;
  }

  get itemKey() {
    return this.state.itemKey;
  }

  get name() {
    return this.state.name;
  }

  get quantity() {
    return this.state.quantity;
  }

  get slot() {
    return this.state.slot;
  }

  get rarity() {
    return this.state.rarity;
  }

  get tier() {
    return this.state.tier;
  }

  get power() {
    return this.state.power;
  }

  get defense() {
    return this.state.defense;
  }

  get maxHp() {
    return this.state.maxHp;
  }

  get category() {
    return getItemCategory(this.state);
  }

  get isLocked() {
    return Boolean(this.state.locked);
  }

  get isEquippable() {
    return isEquippableItemCategory(this.category);
  }

  get isConsumable() {
    return this.category === 'consumable';
  }

  get isResource() {
    return this.category === 'resource';
  }

  hasTag(tag: GameTag) {
    return hasItemTag(this.state, tag);
  }

  snapshot(): Item {
    return this.state;
  }
}
