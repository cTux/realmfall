import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { getRecipeMaterialItemKey } from '../app/App/utils/getRecipeMaterialItemKey';
import { getInventoryItemAction } from '../app/App/utils/getInventoryItemAction';
import { EquipmentSlotId } from '../game/content/ids';
import { GameTag } from '../game/content/tags';
import { Skill } from '../game/types';
import { getAbilityDefinition } from '../game/abilities';
import { getStatusEffectDefinition } from '../game/content/statusEffects';
import {
  createGame,
  getItemConfigByKey,
  getPlayerStats,
  type Item,
} from '../game/state';
import { sellValue } from '../game/inventory';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOW_VISIBILITY,
  DEFAULT_WINDOWS,
} from '../app/constants';
import {
  abilityTooltipLines,
  comparisonLines,
  enemyTooltip,
  itemTooltipLines,
  skillTooltip,
  statusEffectTooltipLines,
  structureTooltip,
} from './tooltips';
import { formatCompactNumber, formatCompactNumberish } from './formatters';
import {
  enemyIconFor,
  enemyTint,
  iconForItem,
  Icons,
  structureIconFor,
  structureTint,
} from './icons';
import { rarityColor } from './rarity';
import { getTooltipPlacementForRect } from './tooltipPlacement';
import { CombatWindow } from './components/CombatWindow';
import { DraggableWindow } from './components/DraggableWindow';
import { EquipmentWindow } from './components/EquipmentWindow';
import { GameTooltip } from './components/GameTooltip';
import { syncFollowCursorTooltipPosition } from './components/GameTooltip/followCursorSync';
import { HeroWindow } from './components/HeroWindow';
import { HexInfoWindow } from './components/HexInfoWindow';
import { InventoryWindow } from './components/InventoryWindow';
import { ItemContextMenu } from './components/ItemContextMenu';
import { LogWindow } from './components/LogWindow';
import { LogWindowContent } from './components/LogWindow/LogWindowContent';
import { LootWindow } from './components/LootWindow';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { getRecipeCraftCount } from './components/RecipeBookWindow/RecipeBookWindowContent';
import { compareRecipeBookEntries } from './components/RecipeBookWindow/utils/recipeBookEntries';
import { SkillsWindow } from './components/SkillsWindow';
import { ItemSlotButton } from './components/ItemSlotButton/ItemSlotButton';

describe('ui helpers and components', () => {
  const renderMarkup = async (node: React.ReactNode) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(node);
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const markup = host.innerHTML;

    await act(async () => {
      root.unmount();
    });
    host.remove();

    return markup;
  };

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes shared constants and lookup helpers', () => {
    expect(DEFAULT_WINDOWS.hero).toEqual({ x: 96, y: 20 });
    expect(DEFAULT_WINDOWS.skills).toEqual({ x: 96, y: 430 });
    expect(DEFAULT_WINDOW_VISIBILITY.hero).toBe(false);
    expect(DEFAULT_LOG_FILTERS.combat).toBe(true);
    expect(rarityColor('legendary')).toBe('#fb923c');
    expect(enemyIconFor('Unknown Foe')).toBe(enemyIconFor('Wolf'));
    expect(enemyTint('Unknown Foe')).toBe(0x60a5fa);
    expect(structureIconFor('town')).toBeTruthy();
    expect(structureIconFor('camp')).toBeTruthy();
    expect(structureIconFor('workshop')).toBeTruthy();
    expect(structureIconFor('tree')).toBeTruthy();
    expect(structureTint('forge')).toBe(0xf97316);
    expect(structureTint('camp')).toBe(0xef4444);
    expect(structureTint('workshop')).toBe(0x22c55e);
    expect(formatCompactNumber(1_250)).toBe('1.3k');
    expect(formatCompactNumber(1_250_000)).toBe('1.3M');
    expect(formatCompactNumberish('+1250')).toBe('+1.3k');
  });

  it('builds item and enemy tooltip lines for multiple branches', () => {
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
    expect(
      tooltipLines.some((line) => line.label?.includes('Change')),
    ).toBe(false);
    expect(
      itemTooltipLines(resource).some((line) => line.label === 'Type'),
    ).toBe(false);
    expect(
      itemTooltipLines(resource).some((line) => line.label === 'Quantity'),
    ).toBe(false);
    expect(
      itemTooltipLines(resource).some((line) => line.text?.includes('TIER')),
    ).toBe(false);
    expect(itemTooltipLines(consumable)).toEqual([
      { kind: 'text', text: 'Use to recover 12 HP and restore 8 hunger.' },
      {
        kind: 'text',
        text: 'Tags: item.food, item.healing',
        tone: 'subtle',
      },
    ]);
    expect(itemTooltipLines(manaPotion)).toEqual([
      { kind: 'text', text: 'Use to restore 10% MP.' },
      {
        kind: 'text',
        text: 'Tags: item.consumable, item.stackable',
        tone: 'subtle',
      },
    ]);
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

    expect(
      abilityTooltipLines({
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
      }, 'enemy', 10),
    ).toContainEqual({
      kind: 'text',
      text: 'Targets one enemy. Deals melee damage.',
    });

    expect(
      abilityTooltipLines({
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
      }, 'allEnemies', 10),
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
      abilityTooltipLines({
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
      }, 'allEnemies', 10),
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
      statusEffectTooltipLines(
        'burning',
        'debuff',
        [],
        {
          id: 'burning',
          value: 3,
          stacks: 2,
          tickIntervalMs: 1000,
        },
      ),
    ).toContainEqual({
      kind: 'stat',
      label: 'Damage',
      value: '6 / 1s',
      tone: 'negative',
    });
    expect(
      statusEffectTooltipLines(
        'poison',
        'debuff',
        [],
        {
          id: 'poison',
          stacks: 3,
          tickIntervalMs: 2000,
        },
      ),
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

  it('uses the rolled cloth icon for Cloth items', () => {
    const cloth: Item = {
      id: 'cloth-1',
      itemKey: 'cloth',
      name: 'Cloth',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };

    expect(iconForItem(cloth)).toBe(getItemConfigByKey('cloth')?.icon);
  });

  it('resolves recipe material filters from canonical item configs', () => {
    expect(
      getRecipeMaterialItemKey({
        itemKey: 'copper-ore',
        tags: [GameTag.ItemResource],
      }),
    ).toBe('copper-ore');
    expect(
      getRecipeMaterialItemKey({
        itemKey: 'town-knife',
        tags: [GameTag.ItemEquipment],
      }),
    ).toBeNull();
  });

  it('sorts craftable recipe-book entries ahead of other learned recipes', () => {
    const craftableEntry = {
      id: 'craftable-recipe',
      name: 'Craftable Entry',
      description: 'Craft now',
      skill: Skill.Crafting as const,
      learned: true,
      output: {
        id: 'crafted-item',
        itemKey: 'town-knife',
        name: 'Town Knife',
        quantity: 1,
        tier: 1,
        rarity: 'common' as const,
        power: 2,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      ingredients: [{ itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 }],
      fuelOptions: undefined,
    };
    const blockedEntry = {
      ...craftableEntry,
      id: 'blocked-recipe',
      name: 'Blocked Entry',
      ingredients: [{ itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 }],
    };

    const sorted = [blockedEntry, craftableEntry].sort((left, right) =>
      compareRecipeBookEntries(left, right, {
        currentStructure: 'workshop',
        inventoryCountsByItemKey: { 'iron-ingot': 1 },
      }),
    );

    expect(sorted.map((entry) => entry.id)).toEqual([
      'craftable-recipe',
      'blocked-recipe',
    ]);
  });

  it('renders tinted tooltip icons when a tooltip line provides an icon tint', () => {
    const markup = renderToStaticMarkup(
      <GameTooltip
        tooltip={{
          title: 'Recipe Materials',
          x: 0,
          y: 0,
          placement: 'right',
          lines: [
            {
              kind: 'stat',
              label: 'Iron Ingot',
              value: '2/1',
              icon: getItemConfigByKey('iron-ingot')?.icon,
              iconTint: getItemConfigByKey('iron-ingot')?.tint,
            },
          ],
        }}
      />,
    );

    expect(markup).toContain('background-color:#f8fafc');
    expect(markup).toContain('-webkit-mask:url(');
  });

  it('renders learned recipe pages with a red inventory border and no overlay', async () => {
    const recipePage: Item = {
      id: 'recipe-craft-weapon',
      recipeId: 'craft-icon-axe-01',
      icon: 'recipe.svg',
      name: 'Recipe: Axe 01',
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

    const markup = await renderMarkup(
      <InventoryWindow
        position={DEFAULT_WINDOWS.inventory}
        onMove={() => {}}
        inventory={[recipePage]}
        equipment={{}}
        learnedRecipeIds={['craft-icon-axe-01']}
        onSort={() => {}}
        onEquip={() => {}}
        onContextItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    expect(markup).toContain('border-color: rgb(239, 68, 68)');
    expect(markup).toContain('box-shadow: 0 0 0 1px #ef444433 inset');
    expect(markup).not.toContain('background-color:rgba(96, 165, 250, 0.28)');
  });

  it('renders recipe-book tabs in cooking, smelting, crafting order', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="workshop"
          recipeSkillLevels={{
            [Skill.Gathering]: 1,
            [Skill.Logging]: 1,
            [Skill.Mining]: 1,
            [Skill.Skinning]: 1,
            [Skill.Fishing]: 1,
            [Skill.Cooking]: 1,
            [Skill.Smelting]: 1,
            [Skill.Crafting]: 1,
          }}
          recipes={[
            {
              id: 'craft-town-knife',
              name: 'Town Knife',
              description: 'Workshop recipe',
              skill: Skill.Crafting,
              learned: true,
              output: {
                id: 'crafted-town-knife',
                itemKey: 'town-knife',
                name: 'Town Knife',
                quantity: 1,
                tier: 1,
                rarity: 'common',
                power: 2,
                defense: 0,
                maxHp: 0,
                healing: 0,
                hunger: 0,
              },
              ingredients: [],
            },
            {
              id: 'smelt-iron-ingot',
              name: 'Iron Ingot',
              description: 'Furnace recipe',
              skill: Skill.Smelting,
              learned: true,
              output: {
                id: 'smelted-iron-ingot',
                itemKey: 'iron-ingot',
                name: 'Iron Ingot',
                quantity: 1,
                tier: 1,
                rarity: 'common',
                power: 0,
                defense: 0,
                maxHp: 0,
                healing: 0,
                hunger: 0,
              },
              ingredients: [],
              fuelOptions: [],
            },
            {
              id: 'cook-cooked-fish',
              name: 'Cooked Fish',
              description: 'Camp recipe',
              skill: Skill.Cooking,
              learned: true,
              output: {
                id: 'cooked-fish',
                itemKey: 'cooked-fish',
                name: 'Cooked Fish',
                quantity: 1,
                tier: 1,
                rarity: 'common',
                power: 0,
                defense: 0,
                maxHp: 0,
                healing: 0,
                hunger: 8,
              },
              ingredients: [],
            },
          ]}
          inventoryCountsByItemKey={{}}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const tabLabels = Array.from(host.querySelectorAll('[role="tab"]')).map(
      (tab) => tab.textContent,
    );
    expect(tabLabels).toEqual(['cooking', 'smelting', 'crafting']);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('reveals large recipe lists in batches', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="workshop"
          recipeSkillLevels={{
            [Skill.Gathering]: 1,
            [Skill.Logging]: 1,
            [Skill.Mining]: 1,
            [Skill.Skinning]: 1,
            [Skill.Fishing]: 1,
            [Skill.Cooking]: 1,
            [Skill.Smelting]: 1,
            [Skill.Crafting]: 1,
          }}
          recipes={Array.from({ length: 45 }, (_, index) => ({
            id: `craft-batch-${index + 1}`,
            name: `Recipe ${index + 1}`,
            description: 'Workshop recipe',
            skill: Skill.Crafting,
            learned: true,
            output: {
              id: `crafted-batch-${index + 1}`,
              itemKey: 'town-knife',
              name: `Recipe ${index + 1}`,
              quantity: 1,
              tier: 1,
              rarity: 'common' as const,
              power: 1,
              defense: 0,
              maxHp: 0,
              healing: 0,
              hunger: 0,
            },
            ingredients: [],
          }))}
          inventoryCountsByItemKey={{}}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      Array.from(host.querySelectorAll('span')).filter((node) =>
        node.textContent?.startsWith('Recipe '),
      ),
    ).toHaveLength(40);

    const loadMoreButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Show 5 more'),
    );

    expect(loadMoreButton).toBeDefined();

    await act(async () => {
      loadMoreButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(
      Array.from(host.querySelectorAll('span')).filter((node) =>
        node.textContent?.startsWith('Recipe '),
      ),
    ).toHaveLength(45);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders learned crafting recipe slots with a fixed white tint', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="workshop"
          recipeSkillLevels={{
            [Skill.Gathering]: 1,
            [Skill.Logging]: 1,
            [Skill.Mining]: 1,
            [Skill.Skinning]: 1,
            [Skill.Fishing]: 1,
            [Skill.Cooking]: 1,
            [Skill.Smelting]: 1,
            [Skill.Crafting]: 1,
          }}
          recipes={[
            {
              id: 'craft-town-knife',
              name: 'Town Knife',
              description: 'Workshop recipe',
              skill: Skill.Crafting,
              learned: true,
              output: {
                id: 'crafted-town-knife',
                itemKey: 'town-knife',
                name: 'Town Knife',
                quantity: 1,
                tier: 1,
                rarity: 'rare',
                power: 2,
                defense: 0,
                maxHp: 0,
                healing: 0,
                hunger: 0,
              },
              ingredients: [],
            },
          ]}
          inventoryCountsByItemKey={{}}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const slot = host.querySelector('button[data-size="compact"]');
    expect(slot?.getAttribute('style')).toContain(
      'border-color: rgb(248, 250, 252)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders learned crafting recipe slots red when the required workshop hex is missing', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="camp"
          recipeSkillLevels={{
            [Skill.Gathering]: 1,
            [Skill.Logging]: 1,
            [Skill.Mining]: 1,
            [Skill.Skinning]: 1,
            [Skill.Fishing]: 1,
            [Skill.Cooking]: 1,
            [Skill.Smelting]: 1,
            [Skill.Crafting]: 1,
          }}
          recipes={[
            {
              id: 'craft-town-knife',
              name: 'Town Knife',
              description: 'Workshop recipe',
              skill: Skill.Crafting,
              learned: true,
              output: {
                id: 'crafted-town-knife',
                itemKey: 'town-knife',
                name: 'Town Knife',
                quantity: 1,
                tier: 1,
                rarity: 'rare',
                power: 2,
                defense: 0,
                maxHp: 0,
                healing: 0,
                hunger: 0,
              },
              ingredients: [],
            },
          ]}
          inventoryCountsByItemKey={{}}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const slot = host.querySelector('button[data-size="compact"]');
    expect(slot?.getAttribute('style')).toContain(
      'border-color: rgba(248, 113, 113, 0.92)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('maps recipe action button modifiers to bulk craft counts', () => {
    expect(
      getRecipeCraftCount({
        ctrlKey: false,
        metaKey: false,
        shiftKey: true,
      } as React.MouseEvent<HTMLButtonElement>),
    ).toBe(5);
    expect(
      getRecipeCraftCount({
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
      } as React.MouseEvent<HTMLButtonElement>),
    ).toBe('max');
    expect(
      getRecipeCraftCount({
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
      } as React.MouseEvent<HTMLButtonElement>),
    ).toBe('max');
    expect(
      getRecipeCraftCount({
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      } as React.MouseEvent<HTMLButtonElement>),
    ).toBe(1);
  });

  it('shows recipe action button tooltip lines for bulk craft modifiers', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const hoverDetail = vi.fn();
    const leaveDetail = vi.fn();

    await act(async () => {
      root.render(
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="camp"
          recipeSkillLevels={{
            [Skill.Gathering]: 1,
            [Skill.Logging]: 1,
            [Skill.Mining]: 1,
            [Skill.Skinning]: 1,
            [Skill.Fishing]: 1,
            [Skill.Cooking]: 1,
            [Skill.Smelting]: 1,
            [Skill.Crafting]: 1,
          }}
          recipes={[
            {
              id: 'cook-cooked-fish',
              name: 'Cooked Fish',
              description: 'Camp recipe',
              skill: Skill.Cooking,
              learned: true,
              output: {
                id: 'cooked-fish',
                itemKey: 'cooked-fish',
                name: 'Cooked Fish',
                quantity: 1,
                tier: 1,
                rarity: 'common',
                power: 0,
                defense: 0,
                maxHp: 0,
                healing: 0,
                hunger: 8,
              },
              ingredients: [],
            },
          ]}
          inventoryCountsByItemKey={{}}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
          onHoverDetail={hoverDetail}
          onLeaveDetail={leaveDetail}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const actionButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Cook',
    );
    expect(actionButton).toBeTruthy();

    await act(async () => {
      actionButton?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalled();
    const hoverArgs = hoverDetail.mock.calls[hoverDetail.mock.calls.length - 1];
    expect(hoverArgs?.[1]).toBe('Bulk Crafting');
    expect(hoverArgs?.[2]).toEqual([
      { kind: 'text', text: 'Shift-click: craft up to 5 times.' },
      { kind: 'text', text: 'Ctrl-click: craft the maximum possible amount.' },
    ]);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders all major windows to static markup', async () => {
    const game = createGame(3, 'ui-render-seed');
    const stats = getPlayerStats(game.player);
    const equippedItem: Item = {
      id: 'equip-helm',
      slot: EquipmentSlotId.Head,
      name: 'Horned Helm',
      quantity: 1,
      tier: 2,
      rarity: 'uncommon',
      power: 0,
      defense: 2,
      maxHp: 1,
      healing: 0,
      hunger: 0,
    };
    const inventoryItem: Item = {
      id: 'resource-gold',
      name: 'Gold',
      quantity: 12,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };
    const combat = {
      coord: { q: 1, r: 0 },
      enemyIds: ['enemy-1'],
      player: {
        abilityIds: ['fireball', 'kick'],
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 900,
        cooldownEndsAt: { kick: 1000, fireball: 4500 },
        casting: {
          abilityId: 'fireball',
          targetId: 'enemy-1',
          endsAt: 500,
        },
      },
      started: false,
      enemies: {
        'enemy-1': {
          abilityIds: ['kick'] as Array<'kick'>,
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 900,
          cooldownEndsAt: { kick: 1000 },
          casting: null,
        },
      },
    };

    const markup = await renderMarkup(
      <>
        <HeroWindow
          position={DEFAULT_WINDOWS.hero}
          onMove={() => {}}
          stats={{
            ...stats,
            rawAttack: stats.attack + 2,
            rawDefense: stats.defense + 2,
            buffs: [],
            debuffs: ['hunger'],
            abilityIds: ['kick'],
          }}
          hunger={45}
        />
        <SkillsWindow
          position={DEFAULT_WINDOWS.skills}
          onMove={() => {}}
          skills={stats.skills}
        />
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="camp"
          recipes={[]}
          recipeSkillLevels={{
            [Skill.Gathering]: 1,
            [Skill.Logging]: 1,
            [Skill.Mining]: 1,
            [Skill.Skinning]: 1,
            [Skill.Fishing]: 1,
            [Skill.Cooking]: 1,
            [Skill.Smelting]: 1,
            [Skill.Crafting]: 1,
          }}
          inventoryCountsByItemKey={{}}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
        />
        <HexInfoWindow
          position={DEFAULT_WINDOWS.hexInfo}
          onMove={() => {}}
          isHome={false}
          onSetHome={() => {}}
          terrain="Forest"
          structure="Tree"
          enemyCount={0}
          interactLabel="Chop tree"
          canInteract
          canTerritoryAction
          territoryActionLabel="Claim hex"
          canProspectInventoryEquipment={false}
          canSellInventoryEquipment={false}
          territoryActionExplanation={null}
          prospectInventoryEquipmentExplanation={null}
          sellInventoryEquipmentExplanation={null}
          onInteract={() => {}}
          onTerritoryAction={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
          structureHp={3}
          structureMaxHp={5}
          territoryName={null}
          territoryOwnerType={null}
          territoryNpc={null}
          townStock={[
            {
              item: equippedItem,
              price: 12,
            },
          ]}
          gold={20}
          onBuyItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <EquipmentWindow
          position={DEFAULT_WINDOWS.equipment}
          onMove={() => {}}
          equipment={{ ...game.player.equipment, head: equippedItem }}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
          onUnequip={() => {}}
          onContextItem={() => {}}
        />
        <InventoryWindow
          position={DEFAULT_WINDOWS.inventory}
          onMove={() => {}}
          inventory={[inventoryItem, equippedItem]}
          equipment={{ ...game.player.equipment, head: equippedItem }}
          learnedRecipeIds={[]}
          onSort={() => {}}
          onEquip={() => {}}
          onContextItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <InventoryWindow
          position={DEFAULT_WINDOWS.inventory}
          onMove={() => {}}
          inventory={[]}
          equipment={game.player.equipment}
          learnedRecipeIds={[]}
          onSort={() => {}}
          onEquip={() => {}}
          onContextItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <LootWindow
          position={DEFAULT_WINDOWS.loot}
          onMove={() => {}}
          loot={[inventoryItem, equippedItem]}
          equipment={{ ...game.player.equipment, head: equippedItem }}
          onClose={() => {}}
          onTakeAll={() => {}}
          onTakeItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <LootWindow
          position={DEFAULT_WINDOWS.loot}
          onMove={() => {}}
          loot={[]}
          equipment={game.player.equipment}
          onClose={() => {}}
          onTakeAll={() => {}}
          onTakeItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs.slice(0, 2)}
        />
        <CombatWindow
          position={DEFAULT_WINDOWS.combat}
          onMove={() => {}}
          combat={combat}
          playerParty={[
            {
              id: 'player',
              name: 'Player',
              level: 10,
              hp: 20,
              maxHp: 30,
              mana: 12,
              maxMana: 20,
              attack: 9,
              actor: combat.player,
              buffs: [],
              debuffs: [],
            },
          ]}
          enemies={[
            {
              id: 'enemy-1',
              name: 'Marauder',
              coord: { q: 1, r: 0 },
              rarity: 'epic',
              tier: 3,
              hp: 6,
              maxHp: 10,
              attack: 5,
              defense: 2,
              xp: 12,
              elite: true,
            },
          ]}
          worldTimeMs={0}
          onStart={() => {}}
          onHoverDetail={() => {}}
          onLeaveDetail={() => {}}
        />
        <GameTooltip
          tooltip={{
            title: 'Knight Blade',
            x: 50,
            y: 70,
            borderColor: rarityColor('rare'),
            lines: [
              { kind: 'text', text: 'RARE TIER 2 WEAPON' },
              {
                kind: 'stat',
                label: 'Attack',
                value: '+4',
                tone: 'item',
                icon: getItemConfigByKey('town-knife')?.icon,
              },
              { kind: 'stat', label: 'Defense', value: '+1', tone: 'item' },
              { kind: 'bar', label: 'HP', current: 3, max: 10 },
            ],
          }}
        />
        <GameTooltip tooltip={null} />
      </>,
    );

    expect(markup).toContain(')haracter info');
    expect(markup).toContain('Hunger');
    expect(markup).toContain('Attack');
    expect(markup).toContain('Defense');
    expect(markup).toContain(')kills');
    expect(markup).toContain('logging');
    expect(markup).toContain('Lv 1 - 0/8');
    expect(markup).not.toContain(
      'gathering level equals the percent chance to pull +1 extra resource',
    );
    expect(markup).toContain(')ecipe book');
    expect(markup).toContain(')ex info');
    expect(markup).toContain('(Q) Gather');
    expect(markup).toContain('Structure HP');
    expect(markup).toContain('Town Stock');
    expect(markup).not.toContain('Enemies0');
    expect(markup).toContain('Horned Helm');
    expect(markup).toContain('Empty');
    expect(markup).toContain('Tak(e) all');
    expect(markup).toContain('Filters');
    expect(markup).toContain('Epic');
    expect(markup).toContain('Player Lv 10');
    expect(markup).toContain('Marauder Lv 3');
    expect(markup).toContain('MP');
    expect(markup).toContain('Casting');
    expect(markup).toContain('Kick');
    expect(markup).toContain(getAbilityDefinition('fireball').name);
    expect(markup).toContain('(Q) Start');
    expect(markup).toContain('Knight Blade');
    expect(markup).toContain(getItemConfigByKey('town-knife')?.icon ?? '');
    expect(iconForItem(inventoryItem)).toBeTruthy();
    expect(iconForItem(undefined, EquipmentSlotId.Weapon)).toBeTruthy();
  });

  it('shows explanations instead of unavailable prospect and sell buttons', async () => {
    const markup = await renderMarkup(
      <>
        <HexInfoWindow
          position={DEFAULT_WINDOWS.hexInfo}
          onMove={() => {}}
          isHome={false}
          onSetHome={() => {}}
          terrain="Plains"
          structure="Forge"
          enemyCount={0}
          interactLabel={null}
          canInteract={false}
          canTerritoryAction={false}
          territoryActionLabel="Claim hex"
          canProspectInventoryEquipment={false}
          canSellInventoryEquipment={false}
          territoryActionExplanation={null}
          prospectInventoryEquipmentExplanation="Nothing in your pack can be prospected."
          sellInventoryEquipmentExplanation={null}
          onInteract={() => {}}
          onTerritoryAction={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
          territoryName={null}
          territoryOwnerType={null}
          territoryNpc={null}
          townStock={[]}
          gold={0}
          onBuyItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <HexInfoWindow
          position={DEFAULT_WINDOWS.hexInfo}
          onMove={() => {}}
          isHome={false}
          onSetHome={() => {}}
          terrain="Plains"
          structure="Town"
          enemyCount={0}
          interactLabel={null}
          canInteract={false}
          canTerritoryAction={false}
          territoryActionLabel="Claim hex"
          canProspectInventoryEquipment={false}
          canSellInventoryEquipment={false}
          territoryActionExplanation={null}
          prospectInventoryEquipmentExplanation={null}
          sellInventoryEquipmentExplanation="No equippable items to sell."
          onInteract={() => {}}
          onTerritoryAction={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
          territoryName={null}
          territoryOwnerType={null}
          territoryNpc={null}
          townStock={[]}
          gold={0}
          onBuyItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
      </>,
    );

    expect(markup).toContain('Nothing in your pack can be prospected.');
    expect(markup).toContain('No equippable items to sell.');
    expect(markup).not.toContain('Sell all equippable');
    expect(markup).not.toContain('>Prospect<');
  });

  it('does not show empty-state text when a hex has an available interact action', async () => {
    const markup = await renderMarkup(
      <HexInfoWindow
        position={DEFAULT_WINDOWS.hexInfo}
        onMove={() => {}}
        isHome={false}
        onSetHome={() => {}}
        terrain="Forest"
        structure="Tree"
        enemyCount={0}
        interactLabel="Chop tree"
        canInteract
        canTerritoryAction={false}
        territoryActionLabel="Claim hex"
        canProspectInventoryEquipment={false}
        canSellInventoryEquipment={false}
        territoryActionExplanation={null}
        prospectInventoryEquipmentExplanation={null}
        sellInventoryEquipmentExplanation={null}
        onInteract={() => {}}
        onTerritoryAction={() => {}}
        onProspect={() => {}}
        onSellAll={() => {}}
        territoryName={null}
        territoryOwnerType={null}
        territoryNpc={null}
        townStock={[]}
        gold={0}
        onBuyItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    expect(markup).toContain('(Q) Gather');
    expect(markup).not.toContain('Nothing of note stirs here.');
  });

  it('renders hero stat bars with compact large values', async () => {
    const markup = await renderMarkup(
      <HeroWindow
        position={DEFAULT_WINDOWS.hero}
        onMove={() => {}}
        visible
        onClose={() => {}}
        hunger={100}
        stats={{
          level: 10,
          masteryLevel: 0,
          hp: 1127,
          maxHp: 1128,
          mana: 25,
          maxMana: 30,
          xp: 450,
          nextLevelXp: 1000,
          rawAttack: 20,
          rawDefense: 15,
          attack: 20,
          defense: 15,
          statusEffects: [],
          buffs: [],
          debuffs: [],
          abilityIds: ['kick'],
          skills: {
            gathering: { level: 1, xp: 0 },
            logging: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 },
            skinning: { level: 1, xp: 0 },
            fishing: { level: 1, xp: 0 },
            cooking: { level: 1, xp: 0 },
            smelting: { level: 1, xp: 0 },
            crafting: { level: 1, xp: 0 },
          },
        }}
      />,
    );

    expect(markup).toContain('1.1k/1.1k');
    expect(markup).toContain('HP');
    expect(markup).toContain('Mana');
    expect(markup).toContain('XP');
    expect(markup).toContain('Hunger');
  });

  it('renders mastery level in the hero title after level 100', () => {
    const markup = renderToStaticMarkup(
      <HeroWindow
        position={DEFAULT_WINDOWS.hero}
        onMove={() => {}}
        visible
        onClose={() => {}}
        hunger={100}
        stats={{
          level: 100,
          masteryLevel: 1,
          hp: 100,
          maxHp: 100,
          mana: 20,
          maxMana: 20,
          xp: 100,
          nextLevelXp: 1000,
          rawAttack: 20,
          rawDefense: 15,
          attack: 20,
          defense: 15,
          statusEffects: [],
          buffs: [],
          debuffs: [],
          abilityIds: ['kick'],
          skills: {
            gathering: { level: 1, xp: 0 },
            logging: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 },
            skinning: { level: 1, xp: 0 },
            fishing: { level: 1, xp: 0 },
            cooking: { level: 1, xp: 0 },
            smelting: { level: 1, xp: 0 },
            crafting: { level: 1, xp: 0 },
          },
        }}
      />,
    );

    expect(markup).toContain('Lv 100 (1)');
  });

  it('raises hovered and active windows during interactions', async () => {
    vi.useFakeTimers();

    const moves: Array<{ x: number; y: number }> = [];
    const closeWindow = vi.fn();
    const close = vi.fn();
    const equip = vi.fn();
    const use = vi.fn();
    const drop = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    const menuItem: Item = {
      id: 'starter-ration',
      name: 'Trail Ration',
      quantity: 2,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 8,
      hunger: 12,
    };

    await act(async () => {
      root?.render(
        <>
          <DraggableWindow
            title="Background Window"
            position={{ x: 12, y: 18 }}
            onMove={() => {}}
          >
            <button type="button">Background action</button>
          </DraggableWindow>
          <DraggableWindow
            title="Test Window"
            position={{ x: 40, y: 50 }}
            onMove={(position) => moves.push(position)}
            onClose={closeWindow}
          >
            <div>Body</div>
          </DraggableWindow>
          <ItemContextMenu
            item={menuItem}
            x={100}
            y={120}
            equipLabel="Equip now"
            canEquip
            canUse
            onEquip={equip}
            onUse={use}
            onDrop={drop}
            onClose={close}
          />
        </>,
      );
    });

    const floatingWindows = Array.from(
      host.querySelectorAll('section[class*="floatingWindow"]'),
    );
    expect(floatingWindows).toHaveLength(2);

    const backgroundWindow = floatingWindows[0] as HTMLElement;
    const testWindow = floatingWindows[1] as HTMLElement;

    expect(testWindow.dataset.windowEmphasis).toBe('idle');

    await act(async () => {
      testWindow.dispatchEvent(
        new MouseEvent('pointerover', {
          bubbles: true,
          clientX: 80,
          clientY: 90,
        }),
      );
    });
    expect(testWindow.dataset.windowEmphasis).toBe('hovered');

    await act(async () => {
      backgroundWindow.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 20,
          clientY: 24,
        }),
      );
    });
    expect(backgroundWindow.dataset.windowEmphasis).toBe('active');
    close.mockClear();

    const header = testWindow.querySelector('div[class*="windowHeader"]');
    expect(header).not.toBeNull();
    await act(async () => {
      header?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 80,
          clientY: 100,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 5,
          clientY: 6,
        }),
      );
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves[moves.length - 1]).toEqual({ x: 8, y: 8 });
    expect(testWindow.dataset.windowEmphasis).toBe('active');
    expect(backgroundWindow.dataset.windowEmphasis).toBe('idle');

    const closeButton = testWindow.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement | null;
    expect(testWindow.textContent).toContain('Body');
    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(testWindow.textContent).toContain('Body');
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(host.textContent).not.toContain('Body');
    expect(closeWindow).toHaveBeenCalledTimes(1);

    const menuButtons = Array.from(host.querySelectorAll('button'));
    await act(async () => {
      menuButtons.find((button) => button.textContent === 'Equip now')?.click();
      menuButtons.find((button) => button.textContent === 'Use')?.click();
      menuButtons
        .find((button) => button.textContent?.startsWith('Drop'))
        ?.click();
    });
    expect(equip).toHaveBeenCalled();
    expect(use).toHaveBeenCalled();
    expect(drop).toHaveBeenCalled();

    await act(async () => {
      document.body.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      );
    });
    expect(close).toHaveBeenCalledTimes(3);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('animates log text like a terminal line', async () => {
    vi.useFakeTimers();

    const game = createGame(2, 'log-animation-test');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs.slice(0, 1)}
        />,
      );
    });

    expect(host.textContent).toContain('Lo(g)');
    expect(host.textContent).not.toContain(game.logs[0]?.text ?? '');
    expect(host.textContent).toContain('00:00');

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    expect(host.textContent).toContain('00:00');
    expect(host.textContent).toContain(
      (game.logs[0]?.text ?? '').replace(/^\[.*?\]\s/, ''),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('anchors left-placed tooltips against the hovered element', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <GameTooltip
          tooltip={{
            title: 'Town',
            x: 120,
            y: 80,
            placement: 'left',
            lines: [{ kind: 'text', text: 'Safe rest and trade.' }],
          }}
        />,
      );
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.style.transform).toBe('translateX(-100%)');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('chooses a fully visible fallback placement for anchored tooltips', () => {
    expect(
      getTooltipPlacementForRect(
        {
          left: 280,
          right: 320,
          top: 80,
          bottom: 120,
          width: 40,
        },
        {
          viewportWidth: 360,
          viewportHeight: 280,
          tooltipWidth: 260,
          tooltipHeight: 120,
        },
      ),
    ).toMatchObject({
      x: 218,
      y: 132,
      placement: 'bottom',
    });

    expect(
      getTooltipPlacementForRect(
        {
          left: 200,
          right: 240,
          top: 20,
          bottom: 60,
          width: 40,
        },
        {
          preferredPlacements: ['top', 'right', 'left', 'bottom'],
          viewportWidth: 520,
          viewportHeight: 260,
          tooltipWidth: 220,
          tooltipHeight: 120,
        },
      ),
    ).toMatchObject({
      x: 252,
      y: 20,
      placement: 'right',
    });
  });

  it('centers bottom-placed tooltips beneath the anchor', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <GameTooltip
          tooltip={{
            title: 'Town',
            x: 180,
            y: 120,
            placement: 'bottom',
            lines: [{ kind: 'text', text: 'Safe rest and trade.' }],
          }}
        />,
      );
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.style.getPropertyValue('--tooltip-transform')).toBe(
      'translateX(-50%)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders lock and recipe actions in the item context menu when available', async () => {
    const markup = await renderMarkup(
      <ItemContextMenu
        item={{
          id: 'iron-chunks',
          itemKey: 'iron-chunks',
          name: 'Iron Chunks',
          tags: [GameTag.ItemResource, GameTag.ItemCraftingMaterial],
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
          locked: true,
        }}
        x={100}
        y={120}
        canEquip={false}
        canUse={false}
        canToggleLock
        isLocked
        canShowRecipes
        canProspectInventoryEquipment
        canSellInventoryEquipment
        onEquip={() => {}}
        onUse={() => {}}
        onDrop={() => {}}
        onToggleLock={() => {}}
        onShowRecipes={() => {}}
        onProspect={() => {}}
        onSell={() => {}}
        onClose={() => {}}
      />,
    );

    expect(markup).toContain('Unlock');
    expect(markup).toContain('Show recipes');
    expect(markup).toContain('Prospect');
    expect(markup).toContain('Sell');
  });

  it('commits draggable window movement on pointer release', async () => {
    const moves: Array<{ x: number; y: number }> = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Batched Window"
          position={{ x: 40, y: 50 }}
          onMove={(position) => moves.push(position)}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    const header = host.querySelector(
      'div[class*="windowHeader"]',
    ) as HTMLDivElement | null;
    expect(header).not.toBeNull();

    await act(async () => {
      header?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 80,
          clientY: 100,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 100,
          clientY: 120,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 140,
          clientY: 160,
        }),
      );
    });

    expect(moves).toHaveLength(0);

    await act(async () => {
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves).toEqual([{ x: 100, y: 110 }]);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('skips draggable window movement commit when no drag delta occurred', async () => {
    const moves: Array<{ x: number; y: number }> = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Batched Window"
          position={{ x: 40, y: 50 }}
          onMove={(position) => moves.push(position)}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    const header = host.querySelector(
      'div[class*="windowHeader"]',
    ) as HTMLDivElement | null;
    expect(header).not.toBeNull();

    await act(async () => {
      header?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 80,
          clientY: 100,
        }),
      );
    });

    await act(async () => {
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves).toEqual([]);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('focuses a window when it becomes visible', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Focus Window"
          position={{ x: 40, y: 50 }}
          onMove={() => {}}
          visible={false}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    expect(host.querySelector('section[class*="floatingWindow"]')).toBeNull();

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Focus Window"
          position={{ x: 40, y: 50 }}
          onMove={() => {}}
          visible
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    await act(async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    });

    const windowElement = host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    expect(windowElement).not.toBeNull();
    expect(windowElement?.dataset.windowEmphasis).toBe('active');
    expect(document.activeElement).toBe(windowElement);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('resizes draggable windows through the shared resize handle', async () => {
    const moves: Array<{
      x: number;
      y: number;
      width?: number;
      height?: number;
    }> = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Resizable Window"
          position={{ x: 40, y: 50, width: 320, height: 240 }}
          onMove={(position) => moves.push(position)}
          resizeBounds={{ minWidth: 280, minHeight: 200 }}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    const windowElement = host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    const resizeHandle = host.querySelector(
      'div[class*="resizeHandle"]',
    ) as HTMLDivElement | null;

    expect(windowElement).not.toBeNull();
    expect(resizeHandle).not.toBeNull();

    vi.spyOn(windowElement!, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 50,
      top: 50,
      left: 40,
      bottom: 290,
      right: 360,
      width: 320,
      height: 240,
      toJSON: () => ({}),
    });

    await act(async () => {
      resizeHandle?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 360,
          clientY: 290,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 420,
          clientY: 340,
        }),
      );
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves[moves.length - 1]).toEqual({
      x: 40,
      y: 50,
      width: 380,
      height: 290,
    });

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('forwards close-button tooltip handlers through shared window shells', async () => {
    const hoverDetail = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'window-tooltip-forwarding');
    const stats = getPlayerStats(game.player);

    await act(async () => {
      root.render(
        <>
          <HeroWindow
            position={DEFAULT_WINDOWS.hero}
            onMove={() => {}}
            stats={{
              ...stats,
              rawAttack: stats.attack,
              rawDefense: stats.defense,
              buffs: [],
              debuffs: [],
              abilityIds: ['kick'],
            }}
            hunger={50}
            onHoverDetail={hoverDetail}
          />
          <RecipeBookWindow
            position={DEFAULT_WINDOWS.recipes}
            onMove={() => {}}
            currentStructure="camp"
            recipes={[]}
            recipeSkillLevels={{
              [Skill.Gathering]: 1,
              [Skill.Logging]: 1,
              [Skill.Mining]: 1,
              [Skill.Skinning]: 1,
              [Skill.Fishing]: 1,
              [Skill.Cooking]: 1,
              [Skill.Smelting]: 1,
              [Skill.Crafting]: 1,
            }}
            inventoryCountsByItemKey={{}}
            materialFilterItemKey={null}
            onResetMaterialFilter={() => {}}
            onCraft={() => {}}
            onHoverDetail={hoverDetail}
          />
          <EquipmentWindow
            position={DEFAULT_WINDOWS.equipment}
            onMove={() => {}}
            equipment={game.player.equipment}
            onHoverItem={() => {}}
            onLeaveItem={() => {}}
            onUnequip={() => {}}
            onContextItem={() => {}}
            onHoverDetail={hoverDetail}
          />
        </>,
      );
    });

    const closeButtons = Array.from(
      host.querySelectorAll('button[aria-label="Close"]'),
    );

    expect(closeButtons).toHaveLength(3);

    await act(async () => {
      closeButtons.forEach((button) => {
        button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      });
    });

    expect(hoverDetail).toHaveBeenCalledTimes(3);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('shows custom tooltips for empty equipment slots', async () => {
    const hoverDetail = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'empty-slot-tooltip');

    await act(async () => {
      root.render(
        <EquipmentWindow
          position={DEFAULT_WINDOWS.equipment}
          onMove={() => {}}
          equipment={game.player.equipment}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
          onUnequip={() => {}}
          onContextItem={() => {}}
          onHoverDetail={hoverDetail}
          onLeaveDetail={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const emptyButtons = Array.from(host.querySelectorAll('button')).filter(
      (button) => button.getAttribute('aria-label') === 'Weapon empty',
    );
    expect(emptyButtons).toHaveLength(1);

    await act(async () => {
      emptyButtons[0]?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      'Weapon',
      [
        {
          kind: 'text',
          text: 'Equip weapon gear here.',
        },
      ],
      'rgba(148, 163, 184, 0.9)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('uses PascalCase skill labels for profession tooltip titles', async () => {
    const hoverDetail = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'skills-tooltip-title');
    const stats = getPlayerStats(game.player);

    await act(async () => {
      root.render(
        <SkillsWindow
          position={DEFAULT_WINDOWS.skills}
          onMove={() => {}}
          skills={stats.skills}
          onHoverDetail={hoverDetail}
          onLeaveDetail={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const craftingRow = Array.from(
      host.querySelectorAll('div[class*="skillRow"]'),
    ).find((row) => row.textContent?.includes('crafting'));
    expect(craftingRow).not.toBeUndefined();

    await act(async () => {
      craftingRow?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      'Crafting',
      expect.any(Array),
      'rgba(56, 189, 248, 0.9)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders the loot window with the shared resize handle', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'loot-window-resize');

    await act(async () => {
      root.render(
        <LootWindow
          position={{ ...DEFAULT_WINDOWS.loot, width: 320, height: 240 }}
          onMove={() => {}}
          loot={game.player.inventory}
          equipment={game.player.equipment}
          onClose={() => {}}
          onTakeAll={() => {}}
          onTakeItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />,
      );
    });

    expect(host.querySelector('div[class*="resizeHandle"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('scrolls the log window to the newest message', async () => {
    vi.useFakeTimers();
    const game = createGame(2, 'log-scroll-test');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLDivElement.prototype,
      'scrollHeight',
    );
    Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 240,
    });

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs.slice(0, 2)}
        />,
      );
    });

    const logList = host.querySelector(
      'div[class*="logList"]',
    ) as HTMLDivElement;

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs}
        />,
      );
      vi.runOnlyPendingTimers();
    });

    expect(logList.scrollTop).toBe(240);

    await act(async () => {
      vi.runOnlyPendingTimers();
      root.unmount();
    });
    if (scrollHeightDescriptor) {
      Object.defineProperty(
        HTMLDivElement.prototype,
        'scrollHeight',
        scrollHeightDescriptor,
      );
    } else {
      delete (HTMLDivElement.prototype as { scrollHeight?: number })
        .scrollHeight;
    }
    vi.useRealTimers();
    host.remove();
  });

  it('marks blood moon log entries with a dedicated red style', async () => {
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={[
            {
              id: 'blood-moon-log',
              kind: 'combat',
              text: '[Year 1, Day 5, 18:00] Blood moon begins. A red hunger sweeps the wilds.',
              turn: 12,
            },
          ]}
        />,
      );
      vi.advanceTimersByTime(2_000);
    });

    const bloodMoonEntry = host.querySelector('div[class*="bloodMoon"]');

    expect(bloodMoonEntry).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('marks harvest moon log entries with a dedicated cyan style', async () => {
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={[
            {
              id: 'harvest-moon-log',
              kind: 'system',
              text: '[Year 1, Day 5, 18:00] Harvest moon rises. A cyan glow stirs the wild herbs and veins.',
              turn: 12,
            },
          ]}
        />,
      );
      vi.advanceTimersByTime(2_000);
    });

    const harvestMoonEntry = host.querySelector('div[class*="harvestMoon"]');

    expect(harvestMoonEntry).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders rich combat log segments and exposes source tooltips on hover', async () => {
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const onHoverDetail = vi.fn();
    const onLeaveDetail = vi.fn();

    await act(async () => {
      root.render(
        <LogWindowContent
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
          logs={[
            {
              id: 'rich-combat-log',
              kind: 'combat',
              text: '[Year 1, Day 5, 18:00] The Marauder deals 12 to you with Fireball.',
              turn: 12,
              richText: [
                { kind: 'entity', text: 'Marauder', rarity: 'epic' },
                { kind: 'text', text: ' deals ' },
                { kind: 'damage', text: '12' },
                { kind: 'text', text: ' to you with ' },
                {
                  kind: 'source',
                  text: 'Fireball',
                  source: { kind: 'ability', abilityId: 'fireball', attack: 12 },
                },
                { kind: 'text', text: '.' },
              ],
            },
          ]}
        />,
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    const sourceLabel = Array.from(host.querySelectorAll('span')).find((node) =>
      node.textContent?.includes('Fireball'),
    ) as HTMLSpanElement | undefined;
    const source = sourceLabel?.parentElement as HTMLSpanElement | null;

    expect(source).not.toBeNull();
    expect(source?.textContent).toContain('Fireball');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('animates tooltip visibility changes', async () => {
    vi.useFakeTimers();

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <GameTooltip
          tooltip={{
            title: 'Knight Blade',
            x: 50,
            y: 70,
            borderColor: rarityColor('rare'),
            lines: [{ kind: 'text', text: 'RARE TIER 2 WEAPON' }],
          }}
        />,
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.dataset.tooltipVisible).toBe('true');

    await act(async () => {
      root.render(<GameTooltip tooltip={null} />);
    });
    expect(tooltip.dataset.tooltipVisible).toBe('false');

    await act(async () => {
      vi.advanceTimersByTime(160);
    });

    expect(host.querySelector('div[class*="tooltip"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('does not blink when only tooltip position changes', async () => {
    vi.useFakeTimers();

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const tooltipData = {
      title: 'Town',
      x: 50,
      y: 70,
      borderColor: '#38bdf8',
      lines: [{ kind: 'text' as const, text: 'Safe rest and trade.' }],
    };

    await act(async () => {
      root.render(<GameTooltip tooltip={tooltipData} />);
    });

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await act(async () => {
      root.render(<GameTooltip tooltip={{ ...tooltipData, x: 90, y: 120 }} />);
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.dataset.tooltipVisible).toBe('true');
    expect(tooltip.style.left).toBe('90px');
    expect(tooltip.style.top).toBe('120px');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('follows pointer refs without changing tooltip visibility', async () => {
    vi.useFakeTimers();

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const positionRef = {
      current: { x: 50, y: 70 },
    };

    await act(async () => {
      root.render(
        <GameTooltip
          tooltip={{
            title: 'Rift Ruin',
            x: 50,
            y: 70,
            followCursor: true,
            borderColor: '#a855f7',
            lines: [{ kind: 'text', text: 'Enemies gather here.' }],
          }}
          positionRef={positionRef}
        />,
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    positionRef.current = { x: 110, y: 130 };

    await act(async () => {
      syncFollowCursorTooltipPosition(positionRef.current);
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.dataset.tooltipVisible).toBe('true');
    expect(tooltip.style.left).toBe('110px');
    expect(tooltip.style.top).toBe('130px');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders recipe slot border and overlay colors independently', () => {
    const markup = renderToStaticMarkup(
      <ItemSlotButton
        item={{
          id: 'recipe-camp-spear',
          name: 'Recipe: Axe 01',
          quantity: 1,
          tier: 1,
          rarity: 'uncommon',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
          recipeId: 'craft-icon-axe-01',
          icon: getItemConfigByKey('icon-axe-01')?.icon,
        }}
        size="compact"
        borderColorOverride="#22c55e"
        overlayColorOverride="rgba(96, 165, 250, 0.28)"
      />,
    );

    expect(markup).toContain('border-color:#22c55e');
    expect(markup).toContain('box-shadow:0 0 0 1px #22c55e33 inset');
    expect(markup).toContain('background-color:rgba(96, 165, 250, 0.28)');
  });
});

