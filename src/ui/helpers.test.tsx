import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import type { Enemy, Item, Tile } from '../game/state';
import { formatCompactNumber, formatCompactNumberish } from './formatters';
import { Icons, iconForItem, itemTint } from './icons';
import { rarityColor } from './rarity';
import {
  comparisonLines,
  itemTooltipLines,
  enemyTooltip,
  structureTooltip,
} from './tooltips';
import { WindowLabel } from './components/WindowLabel/WindowLabel';
import { WindowDock } from './components/WindowDock';
import { WINDOW_LABELS } from './windowLabels';

function createItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    kind: 'artifact',
    name: 'Relic',
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    ...overrides,
  };
}

function createEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'enemy-1',
    name: 'Wolf',
    coord: { q: 0, r: 0 },
    tier: 1,
    hp: 4,
    maxHp: 4,
    attack: 2,
    defense: 1,
    xp: 2,
    elite: false,
    ...overrides,
  };
}

function createTile(overrides: Partial<Tile> = {}): Tile {
  return {
    coord: { q: 0, r: 0 },
    terrain: 'plains',
    items: [],
    enemyIds: [],
    ...overrides,
  };
}

describe('ui helper coverage', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('covers formatter branches for larger and non-finite values', () => {
    expect(formatCompactNumber(12_500)).toBe('13k');
    expect(formatCompactNumberish('9'.repeat(400))).toBe('9'.repeat(400));
  });

  it('covers item icon and tint fallback branches', () => {
    expect(iconForItem(createItem({ name: 'Forest Totem' }))).toBe(Icons.Totem);
    expect(iconForItem(createItem({ kind: 'resource', name: 'Gold' }))).toBe(
      Icons.Coins,
    );
    expect(iconForItem(createItem({ kind: 'consumable', name: 'Meal' }))).toBe(
      Icons.Consumable,
    );
    expect(iconForItem(undefined, 'feet')).toBe(Icons.Boots);

    expect(itemTint()).toBe(rarityColor('common'));
    expect(itemTint(createItem({ kind: 'resource', name: 'Gold' }))).toBe(
      '#fbbf24',
    );
    expect(itemTint(createItem({ rarity: 'rare' }))).toBe(rarityColor('rare'));
  });

  it('covers tooltip branches for grouped enemies and structure variants', () => {
    const uncommonPack = enemyTooltip(
      [
        createEnemy({ id: 'wolf-1', tier: 2 }),
        createEnemy({ id: 'wolf-2', name: 'Boar', tier: 3, attack: 4 }),
        createEnemy({ id: 'wolf-3', name: 'Stag', defense: 2 }),
      ],
      'town',
    );

    expect(uncommonPack?.title).toBe('Enemy Party');
    expect(uncommonPack?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '3' },
      { kind: 'stat', label: 'Enemies', value: '3' },
    ]);

    expect(structureTooltip(createTile())).toBeNull();

    const pondTooltip = structureTooltip(
      createTile({
        structure: 'pond',
        structureMaxHp: 6,
      }),
    );
    expect(pondTooltip?.title).toBe('Pond');
    expect(pondTooltip?.lines).toEqual([
      {
        kind: 'text',
        text: 'A fishing spot that yields raw fish when worked.',
      },
    ]);

    expect(
      structureTooltip(createTile({ structure: 'copper-ore' }))?.title,
    ).toBe('Copper Vein');
    expect(structureTooltip(createTile({ structure: 'iron-ore' }))?.title).toBe(
      'Iron Vein',
    );
    expect(structureTooltip(createTile({ structure: 'coal-ore' }))?.title).toBe(
      'Coal Seam',
    );

    expect(
      structureTooltip(createTile({ structure: 'town' }))?.lines[0]?.text,
    ).toBe(
      'A shardside refuge where survivors trade, resupply, and catch their breath.',
    );
    expect(
      structureTooltip(createTile({ structure: 'forge' }))?.lines[0]?.text,
    ).toBe(
      'A salvage forge where broken gear is stripped down into tradeable worth.',
    );
    expect(
      structureTooltip(createTile({ structure: 'camp' }))?.lines[0]?.text,
    ).toBe('A banked campfire where raw provisions can be made safe to eat.');
    expect(
      structureTooltip(createTile({ structure: 'workshop' }))?.lines[0]?.text,
    ).toBe(
      "A survivor's bench for binding scavenged materials into usable gear.",
    );
    expect(
      structureTooltip(createTile({ structure: 'dungeon' }))?.lines[0]?.text,
    ).toBe(
      'A broken ruin where stronger foes and old spoils gather beneath the fracture.',
    );
  });

  it('covers tooltip comparison branches without equipment and with negative deltas', () => {
    const weakerWeapon = createItem({
      kind: 'weapon',
      slot: 'weapon',
      name: 'Rusty Blade',
      power: 1,
      defense: 0,
      maxHp: 0,
    });
    const equippedWeapon = createItem({
      id: 'item-2',
      kind: 'weapon',
      slot: 'weapon',
      name: 'Knight Blade',
      power: 4,
      defense: 2,
      maxHp: 3,
    });

    expect(comparisonLines(weakerWeapon)).toEqual([
      { label: 'Attack', value: 1 },
    ]);

    const tooltipLines = itemTooltipLines(weakerWeapon, equippedWeapon);
    expect(tooltipLines).toContainEqual({
      kind: 'text',
      text: 'Comparing to equipped',
      tone: 'section',
    });
    expect(tooltipLines).toContainEqual({
      kind: 'stat',
      label: 'Attack Change',
      value: '-3',
      tone: 'negative',
    });

    const sameWeapon = createItem({
      id: 'item-3',
      kind: 'weapon',
      slot: 'weapon',
      name: 'Knight Blade Copy',
      power: 4,
      defense: 2,
      maxHp: 3,
    });

    expect(itemTooltipLines(sameWeapon, equippedWeapon)).toContainEqual({
      kind: 'text',
      text: 'Same as equipped',
    });
  });

  it('renders window labels without a hotkey span when absent', () => {
    const markup = renderToStaticMarkup(
      <WindowLabel
        label={{ plain: 'Loot', prefix: '', hotkey: '', suffix: 'Loot' }}
        hotkeyClassName="hotkey"
        suffix=" window"
      />,
    );

    expect(markup).toBe('Loot window');
  });

  it('shows and hides dock tooltips through focus interactions', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root: Root = createRoot(host);
    const onToggle = vi.fn();

    act(() => {
      root.render(
        <WindowDock
          entries={[
            {
              key: 'hero',
              label: 'Hero',
              title: WINDOW_LABELS.hero,
              icon: Icons.Player,
              shown: false,
            },
          ]}
          onToggle={onToggle}
        />,
      );
    });

    const button = host.querySelector('button');
    expect(button?.textContent).toBe('');

    act(() => {
      button?.focus();
    });
    expect(host.textContent).toContain('(C)haracter info');

    act(() => {
      button?.blur();
    });
    expect(host.textContent).not.toContain('(C)haracter info');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onToggle).toHaveBeenCalledWith('hero');

    act(() => {
      root.unmount();
    });
    host.remove();
  });
});
