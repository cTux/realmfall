import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ItemSlot as ItemSlotButton,
  Tooltip as GameTooltip,
} from '@realmfall/ui';
import { DEFAULT_WINDOWS } from '../app/constants';
import { getRecipeMaterialItemKey } from '../app/App/utils/getRecipeMaterialItemKey';
import { GameTag } from '../game/content/tags';
import { getItemConfigByKey } from '../game/stateSelectors';
import type { Item } from '../game/stateTypes';
import { InventoryWindow } from './components/InventoryWindow';
import { getRecipeCraftCount } from './components/RecipeBookWindow/RecipeBookWindowContent';
import { compareRecipeBookEntries } from './components/RecipeBookWindow/utils/recipeBookEntries';
import { iconForItem } from './icons';
import { createRecipe } from './uiRecipeBookTestHelpers';
import { renderMarkup, setupUiTestEnvironment } from './uiTestHelpers';

setupUiTestEnvironment();

describe('ui recipe book logic and markup', () => {
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

  it('sorts favorite recipes ahead of non-favorites, then craftable recipes', () => {
    const favoriteBlockedEntry = createRecipe({
      id: 'favorite-blocked-recipe',
      name: 'Favorite Blocked Entry',
      favorite: true,
      ingredients: [{ itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 }],
    });
    const craftableEntry = createRecipe({
      id: 'craftable-recipe',
      name: 'Craftable Entry',
      description: 'Craft now',
      output: {
        id: 'crafted-item',
        name: 'Town Knife',
      },
      ingredients: [{ itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 }],
    });
    const blockedEntry = createRecipe({
      id: 'blocked-recipe',
      name: 'Blocked Entry',
      ingredients: [{ itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 }],
    });

    const sorted = [blockedEntry, craftableEntry, favoriteBlockedEntry].sort(
      (left, right) =>
        compareRecipeBookEntries(left, right, {
          currentStructure: 'workshop',
          inventoryCountsByItemKey: { 'iron-ingot': 1 },
        }),
    );

    expect(sorted.map((entry) => entry.id)).toEqual([
      'favorite-blocked-recipe',
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

  it('renders learned recipe pages with a white border and a green scroll-quill icon', async () => {
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
        onActivateItem={() => {}}
        onSellItem={() => {}}
        onContextItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    expect(markup).toContain('border-color: rgb(248, 250, 252)');
    expect(markup).toContain('box-shadow: 0 0 0 1px #f8fafc33 inset');
    expect(markup).toContain('background-color: rgb(34, 197, 94)');
    expect(markup).not.toContain('recipe.svg');
    expect(markup).not.toContain('background-color:rgba(96, 165, 250, 0.28)');
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
