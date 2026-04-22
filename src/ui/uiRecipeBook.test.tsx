import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { DEFAULT_WINDOWS } from '../app/constants';
import { getRecipeMaterialItemKey } from '../app/App/utils/getRecipeMaterialItemKey';
import { GameTag } from '../game/content/tags';
import { getItemConfigByKey, type Item } from '../game/state';
import { Skill } from '../game/types';
import { GameTooltip } from './components/GameTooltip';
import { InventoryWindow } from './components/InventoryWindow';
import { ItemSlotButton } from './components/ItemSlotButton/ItemSlotButton';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { getRecipeCraftCount } from './components/RecipeBookWindow/RecipeBookWindowContent';
import { compareRecipeBookEntries } from './components/RecipeBookWindow/utils/recipeBookEntries';
import { iconForItem } from './icons';

describe('ui recipe book and recipe item coverage', () => {
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
        onActivateItem={() => {}}
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
