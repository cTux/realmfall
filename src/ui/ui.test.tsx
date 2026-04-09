import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { createGame, getPlayerStats, type Item } from '../game/state';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOW_COLLAPSED,
  DEFAULT_WINDOWS,
} from '../app/constants';
import {
  comparisonLines,
  enemyTooltip,
  itemTooltipLines,
  structureTooltip,
} from './tooltips';
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
import { LegendWindow } from './components/LegendWindow';
import { LogWindow } from './components/LogWindow';
import { LootWindow } from './components/LootWindow';

describe('ui helpers and components', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes shared constants and lookup helpers', () => {
    expect(DEFAULT_WINDOWS.hero).toEqual({ x: 20, y: 20 });
    expect(DEFAULT_WINDOW_COLLAPSED.hero).toBe(false);
    expect(DEFAULT_LOG_FILTERS.combat).toBe(true);
    expect(rarityColor('legendary')).toBe('#fb923c');
    expect(enemyIconFor('Unknown Foe')).toBe(enemyIconFor('Wolf'));
    expect(enemyTint('Unknown Foe')).toBe(0x60a5fa);
    expect(structureIconFor('town')).toBeTruthy();
    expect(structureIconFor('tree')).toBeTruthy();
    expect(structureTint('forge')).toBe(0xf97316);
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
      { label: 'ATK', value: 3 },
      { label: 'DEF', value: 2 },
      { label: 'HP', value: 3 },
    ]);

    const tooltipLines = itemTooltipLines(weapon, equipped);
    expect(tooltipLines[0]?.text).toContain('LEVEL 2 RARE ITEM');
    expect(tooltipLines.some((line) => line.label === 'ATK Delta')).toBe(true);
    expect(
      itemTooltipLines(resource).some((line) => line.label === 'Type'),
    ).toBe(true);
    expect(
      itemTooltipLines(consumable).some((line) => line.label === 'Heal'),
    ).toBe(true);

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
    expect(groupEnemy?.title).toBe('Dungeon');
    expect(groupEnemy?.lines.some((line) => line.label === 'Types')).toBe(true);

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
    expect(treeTooltip?.lines.some((line) => line.label === 'Skill')).toBe(
      true,
    );
  });

  it('renders all major windows to static markup', () => {
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
    const combat = { coord: { q: 1, r: 0 }, enemyIds: ['enemy-1'] };

    const markup = renderToStaticMarkup(
      <>
        <HeroWindow
          position={DEFAULT_WINDOWS.hero}
          onMove={() => {}}
          stats={{ ...stats, hungerPenalty: 2 }}
          hunger={45}
        />
        <LegendWindow position={DEFAULT_WINDOWS.legend} onMove={() => {}} />
        <HexInfoWindow
          position={DEFAULT_WINDOWS.hexInfo}
          onMove={() => {}}
          terrain="Forest"
          structure="Tree"
          enemyCount={0}
          interactLabel="Chop tree"
          canInteract
          canProspect={false}
          canSell={false}
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
          player={{ hp: 20, maxHp: 30, attack: 7, defense: 4 }}
          onAttack={() => {}}
        />
        <GameTooltip
          tooltip={{
            title: 'Knight Blade',
            x: 50,
            y: 70,
            borderColor: rarityColor('rare'),
            lines: [
              { kind: 'text', text: 'LEVEL 2 RARE ITEM' },
              { kind: 'stat', label: 'ATK', value: '4', tone: 'positive' },
              { kind: 'stat', label: 'DEF', value: '-1', tone: 'negative' },
              { kind: 'bar', label: 'HP', current: 3, max: 10 },
            ],
          }}
        />
        <GameTooltip tooltip={null} />
      </>,
    );

    expect(markup).toContain('Hero Info');
    expect(markup).toContain('Hunger penalty');
    expect(markup).toContain('Skills');
    expect(markup).toContain('Hex Info');
    expect(markup).toContain('Structure HP');
    expect(markup).toContain('Town Stock');
    expect(markup).toContain('Horned Helm');
    expect(markup).toContain('Empty');
    expect(markup).toContain('Take all');
    expect(markup).toContain('Filters');
    expect(markup).toContain('Elite');
    expect(markup).toContain('Knight Blade');
    expect(iconForItem(inventoryItem)).toBeTruthy();
    expect(iconForItem(undefined, 'weapon')).toBeTruthy();
  });

  it('raises hovered and active windows during interactions', async () => {
    const moves: Array<{ x: number; y: number }> = [];
    const collapsedChanges: boolean[] = [];
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
            onCollapsedChange={(collapsed) => collapsedChanges.push(collapsed)}
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

    const initialBackgroundZIndex = Number(backgroundWindow.style.zIndex);
    const initialTestZIndex = Number(testWindow.style.zIndex);
    expect(initialTestZIndex).toBeGreaterThan(initialBackgroundZIndex);
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
    expect(Number(backgroundWindow.style.zIndex)).toBeGreaterThan(
      Number(testWindow.style.zIndex),
    );
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

    const collapseButton = Array.from(
      testWindow.querySelectorAll('button'),
    ).find((button) => button.textContent === 'collapse');
    expect(testWindow.textContent).toContain('Body');
    await act(async () => {
      collapseButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(testWindow.textContent).not.toContain('Body');
    expect(collapsedChanges).toEqual([true]);

    const menuButtons = Array.from(host.querySelectorAll('button')).filter(
      (button) => button.textContent !== 'expand',
    );
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

    expect(host.textContent).toContain('Log');
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
});
