import { getInventoryItemAction } from '../app/App/utils/getInventoryItemAction';
import { EquipmentSlotId } from '../game/content/ids';
import { GameTag } from '../game/content/tags';
import { Skill } from '../game/types';
import { getAbilityDefinition } from '../game/abilities';
import { getStatusEffectDefinition } from '../game/content/statusEffects';
import type { Item } from '../game/stateTypes';
import { sellValue } from '../game/inventory';
import {
  abilityTooltipLines,
  comparisonLines,
  enemyTooltip,
  itemTooltipLines,
  skillTooltip,
  statusEffectTooltipLines,
  structureTooltip,
} from './tooltips';
import { Icons } from './icons';

describe('ui tooltip content', () => {
  const equipped: Item = {
    id: 'weapon-equipped',
    slot: EquipmentSlotId.Weapon,
    name: 'Old Blade',
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: 1,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };

  const weapon: Item = {
    ...equipped,
    id: 'weapon-new',
    name: 'Knight Blade',
    tags: undefined,
    grantedAbilityId: 'slash',
    tier: 2,
    rarity: 'rare',
    power: 4,
    defense: 2,
    maxHp: 3,
  };

  const consumable: Item = {
    id: 'food-1',
    name: 'Meal',
    tags: [GameTag.ItemFood, GameTag.ItemHealing],
    quantity: 2,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 12,
    hunger: 8,
  };

  const resource: Item = {
    id: 'gold-1',
    name: 'Gold',
    tags: [GameTag.ItemResource, GameTag.ItemCurrency],
    quantity: 7,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };

  const manaPotion: Item = {
    id: 'mana-potion-1',
    itemKey: 'mana-potion',
    name: 'Mana Potion',
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    tags: [GameTag.ItemConsumable, GameTag.ItemStackable],
  };

  const recipePage: Item = {
    id: 'recipe-1',
    recipeId: 'cook-cooked-fish',
    icon: 'recipe.svg',
    name: 'Recipe: Cooked Fish',
    tags: [GameTag.ItemResource, GameTag.ItemRecipe],
    quantity: 1,
    tier: 1,
    rarity: 'uncommon',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    thirst: 0,
  };

  it('builds comparison and equipment item tooltip lines', () => {
    expect(comparisonLines(consumable)).toEqual([]);
    expect(comparisonLines(resource)).toEqual([]);
    expect(comparisonLines(weapon, equipped)).toEqual([
      { label: 'Attack', value: 3 },
      { label: 'Defense', value: 2 },
      { label: 'Max Health', value: 3 },
    ]);

    const tooltipLines = itemTooltipLines(weapon, equipped);

    expect(tooltipLines[0]).toEqual({
      kind: 'text',
      text: 'Rare T2 weapon',
      tone: 'subtle',
    });
    expect(tooltipLines).toContainEqual({
      kind: 'text',
      text: 'Slot: slot.weapon',
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
      value: `${sellValue(weapon)} gold`,
      icon: Icons.Coins,
      iconTint: '#fbbf24',
      tone: 'item',
    });
    expect(
      tooltipLines.findIndex((line) => line.text === 'Slot: slot.weapon'),
    ).toBe(
      tooltipLines.findIndex(
        (line) =>
          line.label === 'Ability' &&
          line.value === getAbilityDefinition('slash').name,
      ) - 1,
    );
    expect(
      tooltipLines.findIndex(
        (line) =>
          line.label === 'Ability' &&
          line.value === getAbilityDefinition('slash').name,
      ),
    ).toBe(
      tooltipLines.findIndex(
        (line) =>
          line.text === 'Tags: item.equipment, item.weapon, item.slot.weapon',
      ) - 1,
    );
    expect(tooltipLines.some((line) => line.label === 'Attack')).toBe(true);
    expect(tooltipLines.some((line) => line.label?.includes('Change'))).toBe(
      false,
    );
    expect(
      itemTooltipLines(resource).some((line) => line.label === 'Type'),
    ).toBe(false);
    expect(
      itemTooltipLines(resource).some((line) => line.label === 'Quantity'),
    ).toBe(false);
    expect(
      itemTooltipLines(resource).some((line) => line.text?.includes('TIER')),
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
      itemTooltipLines(resource).some(
        (line) =>
          line.text === 'Tags: item.resource, item.currency' &&
          line.tone === 'subtle',
      ),
    ).toBe(true);
  });

  it('builds consumable and recipe tooltip variants', () => {
    expect(itemTooltipLines(consumable)).toEqual([
      {
        kind: 'text',
        text: 'Use to recover 12% HP and restore 12% MP and restore 8 hunger.',
      },
      {
        kind: 'text',
        text: 'Tags: item.food, item.healing',
        tone: 'subtle',
      },
    ]);
    expect(itemTooltipLines(manaPotion)).toEqual([
      { kind: 'text', text: 'Use to restore 35% MP.' },
      {
        kind: 'text',
        text: 'Tags: item.consumable, item.stackable',
        tone: 'subtle',
      },
    ]);

    const recipeTooltipLines = itemTooltipLines(recipePage, undefined, {
      recipeLearned: true,
    });

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
      itemTooltipLines(resource).some((line) => line.label === 'Sells for'),
    ).toBe(false);
    expect(getInventoryItemAction(recipePage, ['cook-cooked-fish'])).toBe(
      'use',
    );
    expect(getInventoryItemAction(recipePage, [])).toBe('use');
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

  it('builds enemy, skill, and structure tooltip variants', () => {
    expect(enemyTooltip([], undefined)).toBeNull();

    const singleEnemy = enemyTooltip(
      [
        {
          id: 'wolf-1',
          name: 'Wolf',
          coord: { q: 0, r: 0 },
          rarity: 'uncommon',
          tier: 2,
          hp: 5,
          maxHp: 8,
          attack: 3,
          defense: 1,
          tags: [GameTag.EnemyHostile, GameTag.EnemyAnimal],
          xp: 4,
          elite: false,
        },
      ],
      'town',
    );
    expect(singleEnemy?.title).toBe('Wolf');
    expect(singleEnemy?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '2' },
      { kind: 'stat', label: 'Rarity', value: 'Uncommon' },
      { kind: 'stat', label: 'Enemies', value: '1' },
      {
        kind: 'text',
        text: 'Tags: enemy.hostile, enemy.animal',
        tone: 'subtle',
      },
    ]);

    const groupEnemy = enemyTooltip(
      [
        {
          id: 'raider-1',
          name: 'Raider',
          coord: { q: 1, r: 0 },
          rarity: 'rare',
          tier: 3,
          hp: 7,
          maxHp: 10,
          attack: 4,
          defense: 2,
          xp: 8,
          elite: true,
        },
        {
          id: 'wolf-2',
          name: 'Wolf',
          coord: { q: 1, r: 0 },
          rarity: 'common',
          tier: 2,
          hp: 4,
          maxHp: 6,
          attack: 3,
          defense: 1,
          xp: 5,
          elite: false,
        },
      ],
      'dungeon',
    );
    expect(groupEnemy?.title).toBe('Rift Ruin');
    expect(groupEnemy?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '3' },
      { kind: 'stat', label: 'Rarity', value: 'Rare' },
      { kind: 'stat', label: 'Enemies', value: '2' },
    ]);

    expect(skillTooltip(Skill.Logging, 12)).toContainEqual({
      kind: 'stat',
      label: 'Base Yield Bonus',
      value: '+2',
      tone: 'item',
    });
    expect(skillTooltip(Skill.Logging, 12)).toContainEqual({
      kind: 'stat',
      label: 'Extra Resource Chance',
      value: '12%',
      tone: 'item',
    });
    expect(skillTooltip(Skill.Cooking, 6)).toContainEqual({
      kind: 'stat',
      label: 'Recipe Output Bonus',
      value: '+1',
      tone: 'item',
    });
    expect(skillTooltip(Skill.Crafting, 4)).toContainEqual({
      kind: 'text',
      text: 'Skill level does not change recipe costs, output, or quality directly yet.',
    });
    expect(skillTooltip(Skill.Crafting, 4)).toContainEqual({
      kind: 'text',
      text: 'Tags: skill.profession, skill.crafting',
      tone: 'subtle',
    });
    expect(skillTooltip(Skill.Smelting, 4)).toContainEqual({
      kind: 'text',
      text: 'Tags: skill.profession, skill.smelting',
      tone: 'subtle',
    });

    const treeTooltip = structureTooltip({
      coord: { q: 0, r: 0 },
      terrain: 'forest',
      structure: 'tree',
      structureHp: 3,
      structureMaxHp: 5,
      items: [],
      enemyIds: [],
    });
    expect(treeTooltip?.title).toBe('Tree');
    expect(treeTooltip?.lines).toEqual([
      { kind: 'text', text: 'A logging node that yields logs when harvested.' },
      {
        kind: 'text',
        text: 'Tags: structure.gathering, structure.tree, skill.gathering, skill.logging',
        tone: 'subtle',
      },
    ]);
  });

  it('builds ability tooltip lines for damage, status, and tags', () => {
    expect(
      abilityTooltipLines(
        {
          description: 'Targets one enemy. Deals melee damage.',
          category: 'attacking',
          manaCost: 0,
          cooldownMs: 1000,
          castTimeMs: 0,
          effects: [{ kind: 'damage', powerMultiplier: 1.2, flatPower: 2 }],
          tags: [
            GameTag.AbilityCombat,
            GameTag.AbilityMelee,
            GameTag.AbilityPhysical,
          ],
        },
        'enemy',
        10,
      ),
    ).toContainEqual({
      kind: 'text',
      text: 'Targets one enemy. Deals melee damage.',
    });

    expect(
      abilityTooltipLines(
        {
          description: 'Targets all enemies. Inflicts Shocked.',
          category: 'attacking',
          manaCost: 2,
          cooldownMs: 4800,
          castTimeMs: 250,
          effects: [
            {
              kind: 'applyStatus',
              statusEffectId: 'shocked',
              value: 16,
              durationMs: 8_000,
            },
          ],
          tags: [GameTag.AbilityCombat],
        },
        'allEnemies',
        10,
      ),
    ).toContainEqual({
      kind: 'stat',
      label: 'Effect',
      value: 'Shocked',
      icon: getStatusEffectDefinition('shocked')?.icon,
      iconTint: getStatusEffectDefinition('shocked')?.tint,
      tone: 'negative',
    });

    expect(
      abilityTooltipLines({
        description: 'Targets yourself. Grants Guard.',
        category: 'supportive',
        manaCost: 5,
        cooldownMs: 4300,
        castTimeMs: 200,
        effects: [
          {
            kind: 'applyStatus',
            statusEffectId: 'guard',
            value: 28,
            durationMs: 4_000,
          },
        ],
        tags: [GameTag.AbilityCombat],
      }),
    ).toContainEqual({
      kind: 'stat',
      label: 'Effect',
      value: 'Guard',
      icon: getStatusEffectDefinition('guard')?.icon,
      iconTint: getStatusEffectDefinition('guard')?.tint,
      tone: 'item',
    });

    expect(
      abilityTooltipLines(
        {
          description: 'Targets all enemies. Inflicts Shocked.',
          category: 'attacking',
          manaCost: 2,
          cooldownMs: 4800,
          castTimeMs: 250,
          effects: [
            {
              kind: 'applyStatus',
              statusEffectId: 'shocked',
              value: 16,
              durationMs: 8_000,
            },
          ],
          tags: [GameTag.AbilityCombat],
        },
        'allEnemies',
        10,
      ),
    ).toContainEqual({
      kind: 'stat',
      label: 'Damage',
      value: '0',
    });

    expect(
      abilityTooltipLines({
        description: 'Targets yourself. Restores health.',
        category: 'supportive',
        manaCost: 0,
        cooldownMs: 1000,
        castTimeMs: 0,
        effects: [{ kind: 'heal', powerMultiplier: 1.2 }],
        tags: [
          GameTag.AbilityCombat,
          GameTag.AbilityMelee,
          GameTag.AbilityPhysical,
        ],
      }),
    ).toContainEqual({
      kind: 'text',
      text: 'Tags: ability.combat, ability.melee, ability.physical',
      tone: 'subtle',
    });
    expect(
      abilityTooltipLines({
        description: 'Targets yourself. Restores health.',
        category: 'supportive',
        manaCost: 0,
        cooldownMs: 1000,
        castTimeMs: 0,
        effects: [{ kind: 'heal', powerMultiplier: 1.2 }],
        tags: [GameTag.AbilityCombat],
      }).some((line) => line.label === 'Damage'),
    ).toBe(false);
  });

  it('builds status effect tooltip lines for buffs and debuffs', () => {
    expect(
      statusEffectTooltipLines('restoration', 'buff', [
        {
          kind: 'stat',
          label: 'HP',
          value: '+1% / s',
          tone: 'positive',
        },
      ]),
    ).toContainEqual({
      kind: 'text',
      text: 'Tags: status.buff, status.restoration',
      tone: 'subtle',
    });
    expect(
      statusEffectTooltipLines('burning', 'debuff', [], {
        id: 'burning',
        value: 3,
        stacks: 2,
        tickIntervalMs: 1000,
      }),
    ).toContainEqual({
      kind: 'stat',
      label: 'Damage',
      value: '6 / 1s',
      tone: 'negative',
    });
    expect(
      statusEffectTooltipLines('poison', 'debuff', [], {
        id: 'poison',
        stacks: 3,
        tickIntervalMs: 2000,
      }),
    ).toContainEqual({
      kind: 'stat',
      label: 'Damage',
      value: '3% max HP / 2s',
      tone: 'negative',
    });
    expect(statusEffectTooltipLines('guard', 'buff')[0]).toEqual({
      kind: 'text',
      text: 'Guard raises defense for as long as the effect holds.',
    });
    expect(statusEffectTooltipLines('weakened', 'debuff')[0]).toEqual({
      kind: 'text',
      text: 'Weakened lowers attack while the effect remains.',
    });
    expect(statusEffectTooltipLines('shocked', 'debuff')[0]).toEqual({
      kind: 'text',
      text: 'Shocked lowers defense while crackling mana hangs on you.',
    });
  });
});
