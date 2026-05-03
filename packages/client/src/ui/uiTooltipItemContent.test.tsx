import { getInventoryItemAction } from '../app/App/utils/getInventoryItemAction';
import { EquipmentSlotId } from '../game/content/ids';
import { GameTag } from '../game/content/tags';
import { getAbilityDefinition } from '../game/abilities';
import type { Item } from '../game/stateTypes';
import { sellValue } from '../game/inventory';
import { comparisonLines, itemTooltipLines } from './tooltips';
import { Icons } from './icons';
import {
  consumableTooltipItem,
  equippedTooltipItem,
  manaPotionTooltipItem,
  recipePageTooltipItem,
  resourceTooltipItem,
  weaponTooltipItem,
} from './uiTooltipContentTestHelpers';

describe('ui tooltip item content', () => {
  it('shows comparison-only stats for preview items and base stats otherwise', () => {
    expect(comparisonLines(consumableTooltipItem)).toEqual([]);
    expect(comparisonLines(resourceTooltipItem)).toEqual([]);
    expect(comparisonLines(weaponTooltipItem, equippedTooltipItem)).toEqual([
      { label: 'Attack', value: 3 },
      { label: 'Defense', value: 2 },
      { label: 'Max Health', value: 3 },
    ]);

    const comparisonTooltipLines = itemTooltipLines(
      weaponTooltipItem,
      equippedTooltipItem,
    );
    const standaloneTooltipLines = itemTooltipLines(weaponTooltipItem);
    const equippedItemTooltipLines = itemTooltipLines(equippedTooltipItem);

    expect(comparisonTooltipLines[0]).toEqual({
      kind: 'text',
      text: 'Requires level 2',
      tone: 'negative',
    });
    expect(comparisonTooltipLines[1]).toEqual({
      kind: 'text',
      text: 'Rare T2 weapon',
      tone: 'subtle',
    });
    expect(comparisonTooltipLines).toContainEqual({
      kind: 'stat',
      label: 'Sells for',
      value: `${sellValue(weaponTooltipItem)} gold`,
      icon: Icons.Coins,
      iconTint: '#fbbf24',
      tone: 'item',
    });
    expect(comparisonTooltipLines).toContainEqual({
      kind: 'text',
      text: 'Slot: slot.weapon',
      tone: 'subtle',
    });
    expect(
      itemTooltipLines(weaponTooltipItem, equippedTooltipItem, {
        quickSellHint: true,
      }),
    ).toContainEqual({
      kind: 'text',
      text: 'Shift-click: sell this item immediately.',
      tone: 'subtle',
    });
    expect(comparisonTooltipLines).toContainEqual({
      kind: 'stat',
      label: 'Ability',
      value: getAbilityDefinition('slash').name,
      icon: getAbilityDefinition('slash').icon,
      tone: 'item',
    });
    expect(comparisonTooltipLines).toContainEqual({
      kind: 'stat',
      label: 'Attack',
      value: '+3',
      tone: 'item',
    });
    expect(comparisonTooltipLines).not.toContainEqual({
      kind: 'stat',
      label: 'Attack',
      value: '+4',
      tone: 'item',
    });
    expect(comparisonTooltipLines).toContainEqual({
      kind: 'text',
      text: 'Comparing to equipped',
      tone: 'section',
    });
    expect(comparisonTooltipLines).toContainEqual({
      kind: 'text',
      text: 'Tags: item.equipment, item.weapon, item.slot.weapon',
      tone: 'subtle',
    });
    expect(comparisonTooltipLines[comparisonTooltipLines.length - 1]).toEqual({
      kind: 'stat',
      label: 'Sells for',
      value: `${sellValue(weaponTooltipItem)} gold`,
      icon: Icons.Coins,
      iconTint: '#fbbf24',
      tone: 'item',
    });
    expect(
      comparisonTooltipLines.findIndex(
        (line) => line.text === 'Slot: slot.weapon',
      ),
    ).toBeLessThan(
      comparisonTooltipLines.findIndex(
        (line) =>
          line.label === 'Ability' &&
          line.value === getAbilityDefinition('slash').name,
      ),
    );
    expect(
      comparisonTooltipLines.findIndex(
        (line) =>
          line.label === 'Ability' &&
          line.value === getAbilityDefinition('slash').name,
      ),
    ).toBeLessThan(
      comparisonTooltipLines.findIndex(
        (line) =>
          line.text === 'Tags: item.equipment, item.weapon, item.slot.weapon',
      ),
    );
    expect(
      standaloneTooltipLines.some(
        (line) =>
          line.kind === 'stat' &&
          line.label === 'Attack' &&
          line.value === '+4',
      ),
    ).toBe(true);
    expect(
      standaloneTooltipLines.some(
        (line) => line.text === 'Comparing to equipped',
      ),
    ).toBe(false);
    expect(
      equippedItemTooltipLines.some(
        (line) =>
          line.kind === 'stat' &&
          line.label === 'Attack' &&
          line.value === '+1',
      ),
    ).toBe(true);
    expect(
      equippedItemTooltipLines.some(
        (line) => line.text === 'Comparing to equipped',
      ),
    ).toBe(false);
    expect(
      comparisonTooltipLines.some((line) => line.label?.includes('Change')),
    ).toBe(false);
    expect(
      itemTooltipLines(resourceTooltipItem).some(
        (line) => line.label === 'Type',
      ),
    ).toBe(false);
    expect(
      itemTooltipLines(resourceTooltipItem).some(
        (line) => line.label === 'Quantity',
      ),
    ).toBe(false);
    expect(
      itemTooltipLines(resourceTooltipItem).some((line) =>
        line.text?.includes('TIER'),
      ),
    ).toBe(false);
    expect(
      itemTooltipLines({
        id: 'rare-loot-empty-slot',
        name: 'Rare Ring',
        slot: 'ringLeft',
        quantity: 1,
        tier: 4,
        rarity: 'rare',
        power: 5,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        secondaryStatCapacity: 1,
        secondaryStats: [],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Secondary Stats',
        }),
        expect.objectContaining({
          text: 'Empty secondary stat slot',
        }),
      ]),
    );
    expect(
      itemTooltipLines(resourceTooltipItem).some(
        (line) =>
          line.text === 'Tags: item.resource, item.currency' &&
          line.tone === 'subtle',
      ),
    ).toBe(true);
    expect(
      itemTooltipLines(resourceTooltipItem, undefined, {
        showTags: false,
      }).some((line) => line.text?.startsWith('Tags:')),
    ).toBe(false);
  });

  it('builds consumable and recipe tooltip variants', () => {
    expect(itemTooltipLines(consumableTooltipItem)).toEqual([
      {
        kind: 'text',
        text: 'Restores:',
        tone: 'section',
      },
      {
        kind: 'stat',
        label: 'HP',
        value: '12%',
        tone: 'hp',
      },
      {
        kind: 'stat',
        label: 'MP',
        value: '12%',
        tone: 'mana',
      },
      {
        kind: 'stat',
        label: 'Hunger',
        value: '8%',
        tone: 'hunger',
      },
      {
        kind: 'text',
        text: 'Tags: item.food, item.healing',
        tone: 'subtle',
      },
      {
        kind: 'stat',
        label: 'Sells for',
        value: `${sellValue(consumableTooltipItem)} gold`,
        icon: Icons.Coins,
        iconTint: '#fbbf24',
        tone: 'item',
      },
    ]);
    expect(itemTooltipLines(manaPotionTooltipItem)).toEqual([
      {
        kind: 'text',
        text: 'Restores:',
        tone: 'section',
      },
      {
        kind: 'stat',
        label: 'MP',
        value: '35%',
        tone: 'mana',
      },
      {
        kind: 'text',
        text: 'Tags: item.consumable, item.stackable',
        tone: 'subtle',
      },
      {
        kind: 'stat',
        label: 'Sells for',
        value: `${sellValue(manaPotionTooltipItem)} gold`,
        icon: Icons.Coins,
        iconTint: '#fbbf24',
        tone: 'item',
      },
    ]);
    expect(
      itemTooltipLines({
        ...consumableTooltipItem,
        id: 'pepper-steak-1',
        name: 'Pepper Steak',
        healing: 18,
        hunger: 18,
        thirst: 18,
      }),
    ).toEqual(
      expect.arrayContaining([
        {
          kind: 'text',
          text: 'Restores:',
          tone: 'section',
        },
        {
          kind: 'stat',
          label: 'HP',
          value: '18%',
          tone: 'hp',
        },
        {
          kind: 'stat',
          label: 'MP',
          value: '18%',
          tone: 'mana',
        },
        {
          kind: 'stat',
          label: 'Hunger',
          value: '18%',
          tone: 'hunger',
        },
        {
          kind: 'stat',
          label: 'Thirst',
          value: '18%',
          tone: 'thirst',
        },
      ]),
    );

    const recipeTooltipLines = itemTooltipLines(
      recipePageTooltipItem,
      undefined,
      {
        recipeLearned: true,
      },
    );

    expect(recipeTooltipLines).toContainEqual({
      kind: 'text',
      text: 'Already learned',
      tone: 'negative',
    });
    expect(recipeTooltipLines[recipeTooltipLines.length - 1]).toEqual({
      kind: 'stat',
      label: 'Sells for',
      value: '36 gold',
      icon: Icons.Coins,
      iconTint: '#fbbf24',
      tone: 'item',
    });
    expect(
      itemTooltipLines(resourceTooltipItem).some(
        (line) => line.label === 'Sells for',
      ),
    ).toBe(false);
    expect(
      itemTooltipLines({
        id: 'iron-ore-1',
        itemKey: 'iron-ore',
        name: 'Iron Ore',
        quantity: 2,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        tags: [
          GameTag.ItemResource,
          GameTag.ItemOre,
          GameTag.ItemCraftingMaterial,
        ],
      }).some((line) => line.label === 'Sells for' && line.value === '2 gold'),
    ).toBe(true);
    expect(
      getInventoryItemAction(recipePageTooltipItem, ['cook-cooked-fish']),
    ).toBe('use');
    expect(getInventoryItemAction(recipePageTooltipItem, [])).toBe('use');
  });

  it('marks reforged and enchanted stat lines with dedicated tones', () => {
    const modifiedItem: Item = {
      id: 'modified-weapon',
      slot: EquipmentSlotId.Weapon,
      name: 'Marked Blade',
      quantity: 1,
      tier: 6,
      rarity: 'rare',
      power: 12,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      secondaryStatCapacity: 1,
      secondaryStats: [
        { key: 'attackSpeed', value: 3 },
        { key: 'criticalStrikeChance', value: 3 },
      ],
      reforgedSecondaryStatIndex: 0,
      enchantedSecondaryStatIndex: 1,
    };

    expect(itemTooltipLines(modifiedItem)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Attack Speed',
          tone: 'reforged',
        }),
        expect.objectContaining({
          label: 'Critical Strike Chance',
          tone: 'enchanted',
        }),
      ]),
    );
  });

  it('shows at most one empty secondary stat slot for an item', () => {
    const tooltipLines = itemTooltipLines({
      id: 'legendary-single-empty-slot',
      slot: EquipmentSlotId.RingLeft,
      name: 'Legendary Ring',
      quantity: 1,
      tier: 12,
      rarity: 'legendary',
      power: 0,
      defense: 0,
      maxHp: 24,
      healing: 0,
      hunger: 0,
      secondaryStatCapacity: 3,
      secondaryStats: [{ key: 'attackSpeed', value: 5 }],
    });

    expect(
      tooltipLines.filter((line) => line.text === 'Empty secondary stat slot'),
    ).toHaveLength(1);
  });

  it('shows level requirements and highlights unmet requirements in red', () => {
    expect(
      itemTooltipLines(
        {
          ...weaponTooltipItem,
          requiredLevel: 10,
        },
        undefined,
        {
          playerLevel: 4,
        },
      ),
    ).toContainEqual({
      kind: 'text',
      text: 'Requires level 10',
      tone: 'negative',
    });

    expect(
      itemTooltipLines(
        {
          ...weaponTooltipItem,
          requiredLevel: 10,
        },
        undefined,
        {
          playerLevel: 12,
        },
      ),
    ).toContainEqual({
      kind: 'text',
      text: 'Requires level 10',
      tone: 'subtle',
    });

    expect(
      itemTooltipLines(
        {
          ...weaponTooltipItem,
          requiredLevel: undefined,
          tier: 20,
        },
        undefined,
        {
          playerLevel: 12,
        },
      ),
    ).toContainEqual({
      kind: 'text',
      text: 'Requires level 20',
      tone: 'negative',
    });
  });
});
