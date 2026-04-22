import { act } from 'react';
import { vi } from 'vitest';
import { Skill } from '../game/types';
import { createRecipe, mountRecipeBook } from './uiRecipeBookTestHelpers';
import { setupUiTestEnvironment } from './uiTestHelpers';

setupUiTestEnvironment();

describe('ui recipe book window surfaces', () => {
  it('renders recipe-book tabs in cooking, smelting, crafting order', async () => {
    const ui = await mountRecipeBook({
      currentStructure: 'workshop',
      recipes: [
        createRecipe(),
        createRecipe({
          id: 'smelt-iron-ingot',
          name: 'Iron Ingot',
          description: 'Furnace recipe',
          skill: Skill.Smelting,
          output: {
            id: 'smelted-iron-ingot',
            itemKey: 'iron-ingot',
            name: 'Iron Ingot',
            power: 0,
          },
          fuelOptions: [],
        }),
        createRecipe({
          id: 'cook-cooked-fish',
          name: 'Cooked Fish',
          description: 'Camp recipe',
          skill: Skill.Cooking,
          output: {
            id: 'cooked-fish',
            itemKey: 'cooked-fish',
            name: 'Cooked Fish',
            power: 0,
            hunger: 8,
          },
        }),
      ],
    });

    const tabLabels = Array.from(ui.host.querySelectorAll('[role="tab"]')).map(
      (tab) => tab.textContent,
    );
    expect(tabLabels).toEqual(['cooking', 'smelting', 'crafting']);

    await ui.unmount();
  });

  it('reveals large recipe lists in batches', async () => {
    const ui = await mountRecipeBook({
      currentStructure: 'workshop',
      recipes: Array.from({ length: 45 }, (_, index) =>
        createRecipe({
          id: `craft-batch-${index + 1}`,
          name: `Recipe ${index + 1}`,
          output: {
            id: `crafted-batch-${index + 1}`,
            name: `Recipe ${index + 1}`,
            power: 1,
          },
        }),
      ),
    });

    expect(
      Array.from(ui.host.querySelectorAll('span')).filter((node) =>
        node.textContent?.startsWith('Recipe '),
      ),
    ).toHaveLength(40);

    const loadMoreButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Show 5 more'),
    );
    expect(loadMoreButton).toBeDefined();

    await act(async () => {
      loadMoreButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(
      Array.from(ui.host.querySelectorAll('span')).filter((node) =>
        node.textContent?.startsWith('Recipe '),
      ),
    ).toHaveLength(45);

    await ui.unmount();
  });

  it('renders learned crafting recipe slots with a fixed white tint', async () => {
    const ui = await mountRecipeBook({
      currentStructure: 'workshop',
      recipes: [
        createRecipe({
          output: {
            rarity: 'rare',
          },
        }),
      ],
    });

    const slot = ui.host.querySelector('button[data-size="compact"]');
    expect(slot?.getAttribute('style')).toContain(
      'border-color: rgb(248, 250, 252)',
    );

    await ui.unmount();
  });

  it('renders learned crafting recipe slots red when the required workshop hex is missing', async () => {
    const ui = await mountRecipeBook({
      currentStructure: 'camp',
      recipes: [
        createRecipe({
          output: {
            rarity: 'rare',
          },
        }),
      ],
    });

    const slot = ui.host.querySelector('button[data-size="compact"]');
    expect(slot?.getAttribute('style')).toContain(
      'border-color: rgba(248, 113, 113, 0.92)',
    );

    await ui.unmount();
  });

  it('shows recipe action button tooltip lines for bulk craft modifiers', async () => {
    const hoverDetail = vi.fn();
    const leaveDetail = vi.fn();
    const ui = await mountRecipeBook({
      recipes: [
        createRecipe({
          id: 'cook-cooked-fish',
          name: 'Cooked Fish',
          description: 'Camp recipe',
          skill: Skill.Cooking,
          output: {
            id: 'cooked-fish',
            itemKey: 'cooked-fish',
            name: 'Cooked Fish',
            power: 0,
            hunger: 8,
          },
        }),
      ],
      onHoverDetail: hoverDetail,
      onLeaveDetail: leaveDetail,
    });

    const actionButton = Array.from(ui.host.querySelectorAll('button')).find(
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

    await ui.unmount();
  });
});
