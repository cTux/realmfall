import { renderToStaticMarkup } from 'react-dom/server';
import { getInventoryItemAction } from '../app/App/utils/getInventoryItemAction';
import { getAbilityDefinition } from '../game/abilities';
import { getItemConfigByKey } from '../game/state';
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
import { ItemSlotButton } from './components/ItemSlotButton/ItemSlotButton';

describe('ui visual helpers', () => {
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
    expect(getInventoryItemAction({ recipeId: 'cook-cooked-fish' }, [])).toBe(
      'use',
    );
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
});
