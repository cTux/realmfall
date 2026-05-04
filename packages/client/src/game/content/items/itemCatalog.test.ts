import { describe, expect, it } from 'vitest';
import { ItemId } from '../ids';
import { getConsumableItemKeys } from './itemCatalog';

describe('item catalog', () => {
  it('keeps chest openers out of generic consumable pools', () => {
    expect(getConsumableItemKeys()).not.toContain(ItemId.Lockpick);
    expect(getConsumableItemKeys()).not.toContain(ItemId.ChestKey);
  });
});
