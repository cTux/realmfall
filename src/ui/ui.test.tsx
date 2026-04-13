import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { createGame, getPlayerStats, type Item } from '../game/state';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOW_VISIBILITY,
  DEFAULT_WINDOWS,
} from '../app/constants';
import {
  comparisonLines,
  enemyTooltip,
  itemTooltipLines,
  skillTooltip,
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
    expect(DEFAULT_WINDOW_VISIBILITY.worldTime).toBe(true);
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
      kind: 'weapon',
      slot: 'weapon',
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
      tier: 2,
      rarity: 'rare',
      power: 4,
      defense: 2,
      maxHp: 3,
    };
    const consumable: Item = {
      id: 'food-1',
      kind: 'consumable',
      name: 'Meal',
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
      kind: 'resource',
      name: 'Gold',
      quantity: 7,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };

    expect(comparisonLines(consumable)).toEqual([]);
    expect(comparisonLines(resource)).toEqual([]);
    expect(comparisonLines(weapon, equipped)).toEqual([
      { label: 'Attack', value: 3 },
      { label: 'Defense', value: 2 },
      { label: 'Max Health', value: 3 },
    ]);

    const tooltipLines = itemTooltipLines(weapon, equipped);
    expect(tooltipLines[0]?.text).toContain('RARE TIER 2 WEAPON');
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
    ]);

    expect(enemyTooltip([], undefined)).toBeNull();

    const singleEnemy = enemyTooltip(
      [
        {
          id: 'wolf-1',
          name: 'Wolf',
          coord: { q: 0, r: 0 },
          tier: 2,
          hp: 5,
          maxHp: 8,
          attack: 3,
          defense: 1,
          xp: 4,
          elite: false,
        },
      ],
      'town',
    );
    expect(singleEnemy?.title).toBe('Wolf');
    expect(singleEnemy?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '2' },
      { kind: 'stat', label: 'Enemies', value: '1' },
    ]);

    expect(skillTooltip('logging', 12)).toContainEqual({
      kind: 'stat',
      label: 'Base Yield Bonus',
      value: '+2',
      tone: 'item',
    });
    expect(skillTooltip('logging', 12)).toContainEqual({
      kind: 'stat',
      label: 'Extra Resource Chance',
      value: '12%',
      tone: 'item',
    });
    expect(skillTooltip('crafting', 4)).toContainEqual({
      kind: 'text',
      text: 'Skill level does not change recipe costs, output, or quality directly yet.',
    });

    const groupEnemy = enemyTooltip(
      [
        {
          id: 'raider-1',
          name: 'Raider',
          coord: { q: 1, r: 0 },
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
    ]);
  });

  it('renders all major windows to static markup', async () => {
    const game = createGame(3, 'ui-render-seed');
    const stats = getPlayerStats(game.player);
    const equippedItem: Item = {
      id: 'equip-helm',
      kind: 'armor',
      slot: 'head',
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
      kind: 'resource',
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
            debuffs: ['Hunger'],
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
          hasRecipeBook
          currentStructure="Campfire"
          recipes={[]}
          inventoryCounts={{}}
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
          canProspect={false}
          canSell={false}
          prospectExplanation={null}
          sellExplanation={null}
          onInteract={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
          structureHp={3}
          structureMaxHp={5}
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
              { kind: 'stat', label: 'Attack', value: '+4', tone: 'item' },
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
    expect(markup).toContain('Horned Helm');
    expect(markup).toContain('Empty');
    expect(markup).toContain('Tak(e) all');
    expect(markup).toContain('Filters');
    expect(markup).toContain('Elite');
    expect(markup).toContain('Player Party');
    expect(markup).toContain('Enemy Party');
    expect(markup).toContain('Player Lv 10');
    expect(markup).toContain('Marauder Lv 3');
    expect(markup).toContain('MP');
    expect(markup).toContain('Kick');
    expect(markup).toContain('(Q) Start');
    expect(markup).toContain('Knight Blade');
    expect(iconForItem(inventoryItem)).toBeTruthy();
    expect(iconForItem(undefined, 'weapon')).toBeTruthy();
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
          canProspect={false}
          canSell={false}
          prospectExplanation="Nothing in your pack can be prospected."
          sellExplanation={null}
          onInteract={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
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
          canProspect={false}
          canSell={false}
          prospectExplanation={null}
          sellExplanation="No equippable items to sell."
          onInteract={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
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
      kind: 'consumable',
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

    expect(moves.at(-1)).toEqual({ x: 8, y: 8 });
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

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    expect(host.textContent).toContain(game.logs[0]?.text ?? '');

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
              text: '[Day 5, 18:00] Blood moon begins. A red hunger sweeps the wilds.',
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
              text: '[Day 5, 18:00] Harvest moon rises. A cyan glow stirs the wild herbs and veins.',
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
      vi.advanceTimersByTime(20);
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
