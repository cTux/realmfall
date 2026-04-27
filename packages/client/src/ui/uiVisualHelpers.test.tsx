import { renderToStaticMarkup } from 'react-dom/server';
import { ItemSlot as ItemSlotButton } from '@realmfall/ui';
import { getInventoryItemAction } from '../app/App/utils/getInventoryItemAction';
import { GameTag } from '../game/content/tags';
import { getAbilityDefinition } from '../game/abilities';
import { getItemConfigByKey } from '../game/stateSelectors';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOW_VISIBILITY,
  DEFAULT_WINDOWS,
} from '../app/constants';
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

describe('ui visual helpers', () => {
  it('exposes shared constants and lookup helpers', () => {
    expect(DEFAULT_WINDOWS.hero).toEqual({ x: 96, y: 20 });
    expect(DEFAULT_WINDOWS.skills).toEqual({ x: 96, y: 430 });
    expect(DEFAULT_WINDOW_VISIBILITY.hero).toBe(false);
    expect(DEFAULT_LOG_FILTERS.combat).toBe(true);
    expect(DEFAULT_LOG_FILTERS.command).toBe(true);
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
    expect(
      getInventoryItemAction(
        {
          id: 'recipe-1',
          recipeId: 'cook-cooked-fish',
          name: 'Recipe: Cooked Fish',
          quantity: 1,
          tier: 1,
          rarity: 'uncommon',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
          tags: [GameTag.ItemResource, GameTag.ItemRecipe],
        },
        [],
      ),
    ).toBe('use');
    expect(getAbilityDefinition('slash').name).toBeTruthy();
    expect(Icons.Coins).toBeTruthy();
    expect(iconForItem(undefined, 'weapon')).toBeTruthy();
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

  it('renders a coin badge icon for priced item-slot badges', () => {
    const markup = renderToStaticMarkup(
      <ItemSlotButton
        item={{
          id: 'town-knife-priced',
          name: 'Town Knife',
          quantity: 1,
          tier: 1,
          rarity: 'common',
          power: 1,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        }}
        badgeLabel="12"
        badgeIcon={Icons.Coins}
        badgeIconLabel="Gold"
      />,
    );

    expect(markup).toContain(Icons.Coins);
    expect(markup).toContain('aria-label="Gold"');
    expect(markup).toContain('>12<');
  });
});
