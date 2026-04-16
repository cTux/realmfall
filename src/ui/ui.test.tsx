import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { EquipmentSlotId } from '../game/content/ids';
import { GameTag } from '../game/content/tags';
import { Skill } from '../game/types';
import {
  createGame,
  getItemConfigByKey,
  getPlayerStats,
  type Item,
} from '../game/state';
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
  structureIconFor,
  structureTint,
} from './icons';
import { rarityColor } from './rarity';
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
import { LootWindow } from './components/LootWindow';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { SkillsWindow } from './components/SkillsWindow';

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
    expect(DEFAULT_WINDOWS.worldTime).toEqual({ x: 420, y: 20 });
    expect(DEFAULT_WINDOW_VISIBILITY.worldTime).toBe(false);
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
    expect(
      tooltipLines.findIndex((line) => line.text === 'Slot: slot.weapon'),
    ).toBe(
      tooltipLines.findIndex(
        (line) =>
          line.text === 'Tags: item.equipment, item.weapon, item.slot.weapon',
      ) - 1,
    );
    expect(tooltipLines.some((line) => line.label === 'Attack Change')).toBe(
      true,
    );
    expect(
      itemTooltipLines(resource).some((line) => line.label === 'Type'),
    ).toBe(true);
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
      itemTooltipLines(resource).some(
        (line) =>
          line.text === 'Tags: item.resource, item.currency' &&
          line.tone === 'subtle',
      ),
    ).toBe(true);

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
    expect(skillTooltip(Skill.Crafting, 4)).toContainEqual({
      kind: 'text',
      text: 'Skill level does not change recipe costs, output, or quality directly yet.',
    });
    expect(skillTooltip(Skill.Crafting, 4)).toContainEqual({
      kind: 'text',
      text: 'Tags: skill.profession, skill.crafting',
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
        manaCost: 0,
        cooldownMs: 1000,
        castTimeMs: 0,
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
        abilityIds: ['kick'] as Array<'kick'>,
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 900,
        cooldownEndsAt: { kick: 1000 },
        casting: null,
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
          canClaim
          canProspect={false}
          canSell={false}
          claimExplanation={null}
          prospectExplanation={null}
          sellExplanation={null}
          onInteract={() => {}}
          onClaim={() => {}}
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
              actor: combat.player,
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
    expect(markup).toContain('Player Party');
    expect(markup).toContain('Enemy Party');
    expect(markup).toContain('Player Lv 10');
    expect(markup).toContain('Marauder Lv 3');
    expect(markup).toContain('MP');
    expect(markup).toContain('Kick');
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
          canClaim={false}
          canProspect={false}
          canSell={false}
          claimExplanation={null}
          prospectExplanation="Nothing in your pack can be prospected."
          sellExplanation={null}
          onInteract={() => {}}
          onClaim={() => {}}
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
          canClaim={false}
          canProspect={false}
          canSell={false}
          claimExplanation={null}
          prospectExplanation={null}
          sellExplanation="No equippable items to sell."
          onInteract={() => {}}
          onClaim={() => {}}
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
        canClaim={false}
        canProspect={false}
        canSell={false}
        claimExplanation={null}
        prospectExplanation={null}
        sellExplanation={null}
        onInteract={() => {}}
        onClaim={() => {}}
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
          buffs: [],
          debuffs: [],
          abilityIds: ['kick'],
          skills: {
            logging: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 },
            skinning: { level: 1, xp: 0 },
            fishing: { level: 1, xp: 0 },
            cooking: { level: 1, xp: 0 },
            crafting: { level: 1, xp: 0 },
          },
        }}
      />,
    );

    expect(markup).toContain('1.1k/1.1k');
    expect(markup).toContain('HP');
    expect(markup).toContain('Aether');
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
          buffs: [],
          debuffs: [],
          abilityIds: ['kick'],
          skills: {
            logging: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 },
            skinning: { level: 1, xp: 0 },
            fishing: { level: 1, xp: 0 },
            cooking: { level: 1, xp: 0 },
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
        canProspect
        canSell
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
});
