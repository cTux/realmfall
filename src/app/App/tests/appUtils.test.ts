import { createGame } from '../../../game/state';
import { DEFAULT_WINDOW_VISIBILITY } from '../../constants';
import { getDockEntries } from '../utils/getDockEntries';
import { getInventoryItemAction } from '../utils/getInventoryItemAction';
import { isEditableTarget } from '../utils/isEditableTarget';

describe('app utils', () => {
  it('builds dock entries for optional windows only when visible', () => {
    const baseEntries = getDockEntries(DEFAULT_WINDOW_VISIBILITY, false, false);
    expect(baseEntries.map((entry) => entry.key)).toEqual([
      'worldTime',
      'hero',
      'skills',
      'recipes',
      'hexInfo',
      'equipment',
      'inventory',
      'log',
    ]);

    const expandedEntries = getDockEntries(
      DEFAULT_WINDOW_VISIBILITY,
      true,
      true,
    );
    expect(expandedEntries.map((entry) => entry.key)).toEqual([
      'worldTime',
      'hero',
      'skills',
      'recipes',
      'hexInfo',
      'equipment',
      'inventory',
      'loot',
      'log',
      'combat',
    ]);
  });

  it('derives the inventory action from item type', () => {
    const game = createGame(3, 'app-helper-test');
    const recipeBook = game.player.inventory.find(
      (item) => item.name === 'Recipe Book',
    );
    const consumable = {
      id: 'food-1',
      name: 'Trail Ration',
      quantity: 1,
      tier: 1,
      rarity: 'common' as const,
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 8,
      hunger: 12,
    };
    const equipment = {
      id: 'armor-1',
      slot: 'head' as const,
      name: 'Scout Hood',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon' as const,
      power: 0,
      defense: 1,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };

    expect(getInventoryItemAction(recipeBook)).toBe('open-recipes');
    expect(getInventoryItemAction(consumable)).toBe('use');
    expect(getInventoryItemAction(equipment)).toBe('equip');
    expect(getInventoryItemAction(undefined)).toBe('equip');
  });

  it('recognizes editable targets', () => {
    expect(isEditableTarget(document.createElement('input'))).toBe(true);
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true);
    expect(isEditableTarget(document.createElement('select'))).toBe(true);

    const contentEditable = document.createElement('div');
    Object.defineProperty(contentEditable, 'isContentEditable', {
      value: true,
    });
    expect(isEditableTarget(contentEditable)).toBe(true);

    expect(isEditableTarget(document.createElement('button'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
