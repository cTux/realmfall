import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { ItemId } from './helpersTestkit';
import { buildItemFromConfig } from '../game/content/items';
import { GameTag } from '../game/content/tags';
import type { Enemy, Item, Tile } from '../game/stateTypes';
import {
  DockPanel as WindowDock,
  WindowLabel,
  formatCompactNumber,
  formatCompactNumberish,
  getItemCategory,
} from '@realmfall/ui-react';
import { renderWindowHotkeyLabelText } from './hotkeyLabels';
import { Icons, iconForItem, itemTint, SkillIcon } from './icons';
import { rarityColor } from './rarity';
import {
  comparisonLines,
  itemTooltipLines,
  enemyTooltip,
  structureTooltip,
} from './tooltips';
import { WINDOW_LABELS } from './windowLabels';

function createItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'Hearth Totem',
    itemKey: 'hearth-totem',
    slot: 'offhand',
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

  it('covers formatter branches for larger, rounded, and non-finite values', () => {
    expect(formatCompactNumber(12_500)).toBe('13k');
    expect(formatCompactNumber(0.999999996)).toBe('1');
    expect(formatCompactNumber(12.3456)).toBe('12.35');
    expect(formatCompactNumber(-1.999999996)).toBe('-2');
    expect(formatCompactNumberish('9'.repeat(400))).toBe('9'.repeat(400));
  });

  it('covers item icon and tint fallback branches', () => {
    const recipePage = createItem({
      itemKey: 'recipe-book',
      slot: undefined,
      recipeId: 'cook-cooked-fish',
      icon: 'recipe.svg',
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
    });

    expect(
      iconForItem(
        createItem({ itemKey: undefined, tags: [GameTag.ItemTotem] }),
      ),
    ).toBe(Icons.Totem);
    expect(
      iconForItem(
        createItem({ itemKey: 'gold', name: 'Gold', slot: undefined }),
      ),
    ).toBe(Icons.Coins);
    expect(
      iconForItem(
        createItem({
          itemKey: undefined,
          name: 'Meal',
          slot: undefined,
          healing: 4,
          hunger: 6,
        }),
      ),
    ).toBe(Icons.Consumable);
    expect(iconForItem(undefined, 'feet')).toBe(Icons.Boots);

    expect(itemTint()).toBe(rarityColor('common'));
    expect(
      itemTint(createItem({ itemKey: 'gold', name: 'Gold', slot: undefined })),
    ).toBe('#fbbf24');
    const ironBladeItem = createItem({
      itemKey: undefined,
      slot: 'weapon',
      rarity: 'rare',
      name: 'Iron Blade',
      power: 1,
    });
    expect(
      getItemCategory({ ...ironBladeItem, slot: ironBladeItem.slot, power: 1 }),
    ).toBe('weapon');
    expect(ironBladeItem.slot).toBe('weapon');
    expect(itemTint(ironBladeItem)).toBe('#cbd5e1');
    expect(
      itemTint(
        buildItemFromConfig('pepper', {
          id: 'pepper-1',
        }),
      ),
    ).toBe('#22c55e');
    expect(
      buildItemFromConfig('gold', {
        id: 'gold-2',
      }).tint,
    ).toBe('#fbbf24');
    expect(
      itemTint(
        buildItemFromConfig('beet-tonic', {
          id: 'beet-tonic-tint-override',
          tint: '#00ff00',
        }),
      ),
    ).toBe('#00ff00');
    expect(
      itemTint(
        buildItemFromConfig('beet-tonic', {
          id: 'beet-tonic-1',
        }),
      ),
    ).toBe('#b91c1c');
    expect(iconForItem(recipePage)).toBe(Icons.ScrollQuill);
    expect(itemTint(recipePage)).toBe('#22c55e');
  });

  it('uses theme-first equippable tint families before neutral fallback', () => {
    expect(
      itemTint(
        buildItemFromConfig('ashen-blade', {
          id: 'ashen-blade-1',
        }),
      ),
    ).toBe('#d6d3d1');
    expect(
      itemTint(
        buildItemFromConfig('ashen-boots', {
          id: 'ashen-boots-1',
        }),
      ),
    ).toBe('#44403c');
    expect(
      itemTint(
        buildItemFromConfig(ItemId.WayfarerCloak, {
          id: 'wayfarer-cloak-1',
        }),
      ),
    ).toBe('#64748b');
    expect(
      itemTint(
        buildItemFromConfig(ItemId.CharmNecklace, {
          id: 'charm-necklace-1',
        }),
      ),
    ).toBe('#fbbf24');
    expect(
      itemTint(
        buildItemFromConfig('generated-helmet', {
          id: 'generated-helmet-1',
        }),
      ),
    ).toBe('#94a3b8');
    expect(
      itemTint(
        buildItemFromConfig('icon-helmet-01', {
          id: 'icon-helmet-01-1',
        }),
      ),
    ).toBe('#94a3b8');
    expect(
      itemTint(
        buildItemFromConfig('generated-shoulders', {
          id: 'generated-shoulders-1',
        }),
      ),
    ).toBe('#64748b');
    expect(
      itemTint(
        buildItemFromConfig('icon-shoulders-01', {
          id: 'icon-shoulders-01-1',
        }),
      ),
    ).toBe('#64748b');
    expect(
      itemTint(
        buildItemFromConfig('generated-chest', {
          id: 'generated-chest-1',
        }),
      ),
    ).toBe('#64748b');
    expect(
      itemTint(
        buildItemFromConfig('icon-chest-01', {
          id: 'icon-chest-01-1',
        }),
      ),
    ).toBe('#64748b');
    expect(
      itemTint(
        createItem({
          itemKey: 'unknown-equippable',
          slot: 'weapon',
          name: 'Unknown Weapon',
          power: 1,
        }),
      ),
    ).toBe('#cbd5e1');
  });

  it('uses the dedicated miner icon for the mining skill', () => {
    expect(SkillIcon.mining).toBe(Icons.Miner);
  });

  it('resolves category-driven item icon and tint from shared presentation rules', () => {
    expect(
      iconForItem(
        createItem({
          itemKey: 'generic-armor',
          defense: 2,
          tags: [GameTag.ItemArmor],
        }),
      ),
    ).toBe(Icons.Armor);

    expect(
      itemTint(
        createItem({
          itemKey: 'dawn-cloak',
          slot: 'cloak',
          tags: [GameTag.ItemArmor, GameTag.ItemCloth],
          power: 0,
          defense: 1,
        }),
      ),
    ).toBe('#b45309');
  });

  it('covers tooltip branches for grouped enemies and structure variants', () => {
    const uncommonPack = enemyTooltip(
      [
        createEnemy({
          id: 'wolf-1',
          tier: 2,
          rarity: 'uncommon',
          tags: [GameTag.EnemyHostile],
        }),
        createEnemy({
          id: 'wolf-2',
          name: 'Boar',
          tier: 3,
          rarity: 'rare',
          attack: 4,
          tags: [GameTag.EnemyHostile, GameTag.EnemyAnimal],
        }),
        createEnemy({
          id: 'wolf-3',
          name: 'Stag',
          defense: 2,
          tags: [GameTag.EnemyAnimal],
        }),
      ],
      'town',
    );

    expect(uncommonPack?.title).toBe('Wolf');
    expect(uncommonPack?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '3' },
      { kind: 'stat', label: 'Rarity', value: 'Rare' },
      { kind: 'stat', label: 'Enemies', value: '3' },
      {
        kind: 'text',
        text: 'Tags: enemy.hostile, enemy.animal',
        tone: 'subtle',
      },
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
      {
        kind: 'text',
        text: 'Tags: structure.gathering, structure.fishing, skill.gathering, skill.fishing',
        tone: 'subtle',
      },
    ]);

    expect(
      structureTooltip(createTile({ structure: 'copper-ore' }))?.title,
    ).toBe('Copper Vein');
    expect(structureTooltip(createTile({ structure: 'iron-ore' }))?.title).toBe(
      'Iron Vein',
    );
    expect(structureTooltip(createTile({ structure: 'tin-ore' }))?.title).toBe(
      'Tin Vein',
    );
    expect(structureTooltip(createTile({ structure: 'gold-ore' }))?.title).toBe(
      'Gold Vein',
    );
    expect(
      structureTooltip(createTile({ structure: 'platinum-ore' }))?.title,
    ).toBe('Platinum Vein');
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
    ).toBe('A rift-torn ruin that marks the entrance to a dungeon below.');
    expect(
      structureTooltip(createTile({ structure: 'dungeon' }))?.lines[1],
    ).toEqual({
      kind: 'text',
      text: 'Tags: structure.combat, structure.dungeon',
      tone: 'subtle',
    });
  });

  it('covers tooltip comparison branches without equipment and with negative deltas', () => {
    const weakerWeapon = createItem({
      slot: 'weapon',
      name: 'Rusty Blade',
      power: 1,
      defense: 0,
      maxHp: 0,
    });
    const equippedWeapon = createItem({
      id: 'item-2',
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
      label: 'Attack',
      value: '-3',
      tone: 'negative',
    });

    const sameWeapon = createItem({
      id: 'item-3',
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
        label={{ prefix: '', hotkey: '', suffix: 'Loot' }}
        hotkeyClassName="hotkey"
        suffix=" window"
      />,
    );

    expect(markup).toBe('Loot window');
  });

  it('renders window hotkeys without bracket glyphs', () => {
    const markup = renderToStaticMarkup(
      <WindowLabel label={WINDOW_LABELS.hero} hotkeyClassName="hotkey" />,
    );

    expect(markup).toBe('<span class="hotkey">H</span>ero info');
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
    expect(host.textContent).toContain(
      renderWindowHotkeyLabelText(WINDOW_LABELS.hero),
    );

    act(() => {
      button?.blur();
    });
    expect(host.textContent).not.toContain(
      renderWindowHotkeyLabelText(WINDOW_LABELS.hero),
    );

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
