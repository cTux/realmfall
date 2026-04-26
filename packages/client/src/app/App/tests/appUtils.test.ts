import {
  DEFAULT_WINDOW_VISIBILITY,
  WINDOW_DOCK_KEYS,
  WINDOW_REGISTRY,
} from '../../constants';
import { GameTag } from '../../../game/content/tags';
import { getDockEntries } from '../utils/getDockEntries';
import { getInventoryItemAction } from '../utils/getInventoryItemAction';
import {
  isEditableTarget,
  isFocusableControlTarget,
} from '../utils/isEditableTarget';
import { WINDOW_HOTKEYS } from '../utils/windowHotkeys';

describe('app utils', () => {
  it('builds dock entries for the shared dock windows', () => {
    const baseEntries = getDockEntries(DEFAULT_WINDOW_VISIBILITY);
    expect(baseEntries.map((entry) => entry.key)).toEqual([
      'hero',
      'skills',
      'recipes',
      'hexInfo',
      'equipment',
      'inventory',
      'log',
      'settings',
    ]);
  });

  it('marks dock entries that require attention', () => {
    const entries = getDockEntries(DEFAULT_WINDOW_VISIBILITY, {
      hexInfo: true,
    });
    const hexInfo = entries.find((entry) => entry.key === 'hexInfo');

    expect(hexInfo?.requiresAttention).toBe(true);
    expect(
      entries.every((entry) =>
        entry.key === 'hexInfo' ? true : !entry.requiresAttention,
      ),
    ).toBe(true);
  });

  it('derives dock icons from the canonical window registry', () => {
    const entries = getDockEntries(DEFAULT_WINDOW_VISIBILITY);

    expect(entries.map((entry) => entry.icon)).toEqual(
      WINDOW_DOCK_KEYS.map((key) => WINDOW_REGISTRY[key].icon),
    );
  });

  it('derives window hotkeys from the canonical window registry', () => {
    expect(WINDOW_HOTKEYS).toEqual({
      h: 'hero',
      s: 'skills',
      r: 'recipes',
      c: 'hexInfo',
      e: 'equipment',
      i: 'inventory',
      g: 'log',
      m: 'settings',
    });
  });

  it('derives the inventory action from item type', () => {
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
    const recipePage = {
      id: 'recipe-1',
      recipeId: 'cook-cooked-fish',
      name: 'Recipe: Cooked Fish',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon' as const,
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
    };

    expect(getInventoryItemAction(consumable)).toBe('use');
    expect(getInventoryItemAction(equipment)).toBe('equip');
    expect(getInventoryItemAction(recipePage, ['cook-cooked-fish'])).toBe(
      'use',
    );
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

  it('recognizes focusable control targets that should keep native space behavior', () => {
    expect(isFocusableControlTarget(document.createElement('button'))).toBe(
      true,
    );

    const summary = document.createElement('summary');
    expect(isFocusableControlTarget(summary)).toBe(true);

    const roleButton = document.createElement('div');
    roleButton.setAttribute('role', 'button');
    expect(isFocusableControlTarget(roleButton)).toBe(true);

    expect(isFocusableControlTarget(document.createElement('div'))).toBe(false);
    expect(isFocusableControlTarget(null)).toBe(false);
  });
});
