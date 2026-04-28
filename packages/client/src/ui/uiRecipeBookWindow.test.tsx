import { act } from 'react';
import { vi } from 'vitest';
import { Skill } from '../game/types';
import { createRecipe, mountRecipeBook } from './uiRecipeBookTestHelpers';
import { setupUiTestEnvironment } from './uiTestHelpers';

setupUiTestEnvironment();

describe('ui recipe book window surfaces', () => {
  it('renders recipe-book tabs in hand, cooking, smelting, crafting order', async () => {
    const ui = await mountRecipeBook({
      currentStructure: 'workshop',
      recipes: [
        createRecipe({
          id: 'hand-cloth',
          name: 'Cloth',
          description: 'Twist flax into cloth by hand.',
          skill: Skill.Hand,
          output: {
            id: 'cloth-1',
            itemKey: 'cloth',
            name: 'Cloth',
            power: 0,
          },
        }),
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
    expect(tabLabels).toEqual(['hand', 'cooking', 'smelting', 'crafting']);

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

  it('keeps rarity borders on learned crafting recipe slots while showing the craftable white icon tint', async () => {
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

    const slot = getFirstRecipeSlot(ui.host);
    const icon = getRecipeSlotIcon(slot);

    expect(slot?.getAttribute('style')).toContain(
      'border-color: rgb(96, 165, 250)',
    );
    expect(icon?.getAttribute('style')).toContain(
      'background-color: rgb(248, 250, 252);',
    );

    await ui.unmount();
  });

  it('keeps rarity borders on blocked learned crafting recipe slots while showing the blocked red icon tint', async () => {
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

    const slot = getFirstRecipeSlot(ui.host);
    const icon = getRecipeSlotIcon(slot);

    expect(slot?.getAttribute('style')).toContain(
      'border-color: rgb(96, 165, 250)',
    );
    expect(icon?.getAttribute('style')).toContain(
      'background-color: rgba(248, 113, 113, 0.92);',
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

  it('shows available craft count next to craft action', async () => {
    const ui = await mountRecipeBook({
      currentStructure: 'workshop',
      inventoryCountsByItemKey: { iron: 4 },
      recipes: [
        createRecipe({
          id: 'craft-iron-shield',
          name: 'Iron Shield',
          learned: true,
          ingredients: [{ itemKey: 'iron', name: 'Iron', quantity: 2 }],
        }),
      ],
    });

    const craftButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Craft',
    );
    const craftCount =
      craftButton?.parentElement?.querySelector('span')?.textContent;

    expect(craftCount).toBe('x2');

    await ui.unmount();
  });

  it('shows blocked craft reasons when a learned recipe action button is disabled', async () => {
    const hoverDetail = vi.fn();
    const leaveDetail = vi.fn();
    const ui = await mountRecipeBook({
      currentStructure: 'camp',
      recipes: [
        createRecipe({
          id: 'missing-materials-camp-knife',
          name: 'Camp Knife',
          learned: true,
          skill: Skill.Hand,
          ingredients: [{ itemKey: 'wood', name: 'Wood', quantity: 2 }],
          output: {
            id: 'camp-knife',
            name: 'Camp Knife',
          },
        }),
      ],
      onHoverDetail: hoverDetail,
      onLeaveDetail: leaveDetail,
    });

    const actionButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) =>
        button.textContent === 'Craft' && button.hasAttribute('disabled'),
    );

    expect(actionButton).toBeDefined();

    await act(async () => {
      actionButton?.parentElement?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalled();
    const actionHoverArgs =
      hoverDetail.mock.calls[hoverDetail.mock.calls.length - 1];
    expect(actionHoverArgs?.[1]).toBe('Camp Knife');
    expect(actionHoverArgs?.[2]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'text', text: 'Materials' }),
        expect.objectContaining({ kind: 'stat', label: 'Wood', value: '0/2' }),
      ]),
    );

    await act(async () => {
      actionButton?.parentElement?.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true }),
      );
    });

    expect(leaveDetail).toHaveBeenCalledTimes(1);
    await ui.unmount();
  });

  it('shows a loot-first tooltip for missing recipes', async () => {
    const hoverDetail = vi.fn();
    const leaveDetail = vi.fn();
    const ui = await mountRecipeBook({
      recipes: [
        createRecipe({
          id: 'missing-cook-fish',
          name: 'Missing Cooked Fish',
          learned: false,
          description: 'Defeat enemies for this recipe.',
        }),
      ],
      onHoverDetail: hoverDetail,
      onLeaveDetail: leaveDetail,
    });

    const recipeSlot = getFirstRecipeSlot(ui.host);
    const actionButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Craft',
    );

    await act(async () => {
      recipeSlot?.parentElement?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalled();
    const slotHoverArgs =
      hoverDetail.mock.calls[hoverDetail.mock.calls.length - 1];
    expect(slotHoverArgs?.[1]).toBe('Missing Cooked Fish');
    expect(slotHoverArgs?.[2]).toEqual([
      {
        kind: 'text',
        text: 'This recipe is missing and requires to be looted first.',
        tone: 'negative',
      },
    ]);

    await act(async () => {
      actionButton?.parentElement?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    const actionHoverArgs =
      hoverDetail.mock.calls[hoverDetail.mock.calls.length - 1];
    expect(actionHoverArgs?.[1]).toBe('Missing Cooked Fish');
    expect(actionHoverArgs?.[2]).toEqual([
      {
        kind: 'text',
        text: 'This recipe is missing and requires to be looted first.',
        tone: 'negative',
      },
    ]);

    await act(async () => {
      recipeSlot?.parentElement?.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true }),
      );
      actionButton?.parentElement?.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true }),
      );
    });

    expect(leaveDetail).toHaveBeenCalledTimes(2);

    await ui.unmount();
  });

  it('shows an outlined star for non-favorite learned recipes', async () => {
    const ui = await mountRecipeBook({
      recipes: [
        createRecipe({
          id: 'craft-town-knife',
          name: 'Town Knife',
          favorite: false,
        }),
      ],
    });

    const starButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') === 'Favorite recipe: Town Knife',
    );

    expect(starButton).toBeTruthy();
    expect(starButton?.querySelector('span')).toBeTruthy();
    expect(starButton?.querySelector('span')?.getAttribute('style')).toContain(
      'background-color: rgb(148, 163, 184);',
    );
    expect(starButton?.hasAttribute('disabled')).toBe(false);

    await ui.unmount();
  });

  it('shows a filled star and toggles favorite recipe state on click', async () => {
    const onToggleFavoriteRecipe = vi.fn();
    const ui = await mountRecipeBook({
      recipes: [
        createRecipe({
          id: 'craft-town-knife',
          name: 'Town Knife',
          favorite: false,
        }),
      ],
      onToggleFavoriteRecipe,
    });

    const starButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') === 'Favorite recipe: Town Knife',
    );

    expect(starButton).toBeTruthy();

    await act(async () => {
      starButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onToggleFavoriteRecipe).toHaveBeenCalledWith('craft-town-knife');
    await ui.unmount();
  });

  it('disables the favorite star for missing recipes', async () => {
    const onToggleFavoriteRecipe = vi.fn();
    const ui = await mountRecipeBook({
      recipes: [
        createRecipe({
          id: 'missing-camp-knife',
          name: 'Missing Knife',
          learned: false,
          favorite: false,
        }),
      ],
      onToggleFavoriteRecipe,
    });

    const starButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') === 'Favorite recipe: Missing Knife',
    );

    expect(starButton?.hasAttribute('disabled')).toBe(true);

    await act(async () => {
      starButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onToggleFavoriteRecipe).not.toHaveBeenCalled();
    await ui.unmount();
  });

  it('shows a filled star for already-favorite recipes', async () => {
    const ui = await mountRecipeBook({
      recipes: [
        createRecipe({
          id: 'craft-town-knife',
          name: 'Town Knife',
          favorite: true,
        }),
      ],
    });

    const starButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') === 'Unfavorite recipe: Town Knife',
    );

    expect(starButton).toBeTruthy();
    expect(starButton?.querySelector('span')).toBeTruthy();
    expect(starButton?.querySelector('span')?.getAttribute('style')).toContain(
      'background-color: rgb(245, 158, 11);',
    );
    await ui.unmount();
  });

  it('shows available craft count for enabled recipes', async () => {
    const ui = await mountRecipeBook({
      currentStructure: 'workshop',
      inventoryCountsByItemKey: { iron: 4 },
      recipes: [
        createRecipe({
          id: 'craft-iron-shield',
          name: 'Iron Shield',
          learned: true,
          ingredients: [{ itemKey: 'iron', name: 'Iron', quantity: 2 }],
        }),
      ],
    });

    expect(ui.host.textContent).toContain('x2');

    await ui.unmount();
  });
});

function getFirstRecipeSlot(host: HTMLElement) {
  const actionButton = Array.from(host.querySelectorAll('button')).find(
    (button) =>
      button.textContent === 'Craft' ||
      button.textContent === 'Cook' ||
      button.textContent === 'Smelt',
  );
  return actionButton?.parentElement?.parentElement?.parentElement?.querySelector(
    'button[data-size="compact"]',
  );
}

function getRecipeSlotIcon(slot?: Element | null) {
  return slot?.querySelector('span[aria-label]');
}
