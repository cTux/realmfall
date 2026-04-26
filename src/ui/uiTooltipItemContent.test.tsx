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
  it('builds comparison and equipment item tooltip lines', () => {
    expect(comparisonLines(consumableTooltipItem)).toEqual([]);
    expect(comparisonLines(resourceTooltipItem)).toEqual([]);
    expect(comparisonLines(weaponTooltipItem, equippedTooltipItem)).toEqual([
      { label: 'Attack', value: 3 },
      { label: 'Defense', value: 2 },
      { label: 'Max Health', value: 3 },
    ]);

    const tooltipLines = itemTooltipLines(
      weaponTooltipItem,
      equippedTooltipItem,
    );

    expect(tooltipLines[0]).toEqual({
      kind: 'text',
      text: 'Rare T2 weapon',
      tone: 'subtle',
    });
    expect(tooltipLines).toContainEqual({
      kind: 'stat',
      label: 'Sells for',
      value: `${sellValue(weaponTooltipItem)} gold`,
      icon: Icons.Coins,
      iconTint: '#fbbf24',
      tone: 'item',
    });
    expect(tooltipLines).toContainEqual({
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
    expect(tooltipLines).toContainEqual({
      kind: 'stat',
      label: 'Ability',
      value: getAbilityDefinition('slash').name,
      icon: getAbilityDefinition('slash').icon,
      tone: 'item',
    });
    expect(tooltipLines).toContainEqual({
      kind: 'stat',
      label: 'Attack',
      value: '+4',
      tone: 'item',
    });
    expect(tooltipLines).toContainEqual({
      kind: 'text',
      text: 'Comparing to equipped',
      tone: 'section',
    });
    expect(tooltipLines).toContainEqual({
      kind: 'text',
      text: 'Tags: item.equipment, item.weapon, item.slot.weapon',
      tone: 'subtle',
    });
    expect(tooltipLines[tooltipLines.length - 1]).toEqual({
      kind: 'stat',
      label: 'Sells for',
      value: `${sellValue(weaponTooltipItem)} gold`,
      icon: Icons.Coins,
      iconTint: '#fbbf24',
      tone: 'item',
    });
    expect(
      tooltipLines.findIndex((line) => line.text === 'Slot: slot.weapon'),
    ).toBeLessThan(
      tooltipLines.findIndex(
        (line) =>
          line.label === 'Ability' &&
          line.value === getAbilityDefinition('slash').name,
      ),
    );
    expect(
      tooltipLines.findIndex(
        (line) =>
          line.label === 'Ability' &&
          line.value === getAbilityDefinition('slash').name,
      ),
    ).toBeLessThan(
      tooltipLines.findIndex(
        (line) =>
          line.text === 'Tags: item.equipment, item.weapon, item.slot.weapon',
      ),
    );
    expect(tooltipLines.some((line) => line.label === 'Attack')).toBe(true);
    expect(tooltipLines.some((line) => line.label?.includes('Change'))).toBe(
      false,
    );
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
  });

  it('builds consumable and recipe tooltip variants', () => {
    expect(itemTooltipLines(consumableTooltipItem)).toEqual([
      {
        kind: 'text',
        text: 'Use to recover 12% HP and restore 12% MP and restore 8% hunger.',
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
      { kind: 'text', text: 'Use to restore 35% MP.' },
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
