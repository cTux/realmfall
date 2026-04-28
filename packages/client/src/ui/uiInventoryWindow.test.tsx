import { act } from 'react';
import { buildItemFromConfig, getItemConfigByKey } from '../game/content/items';
import { ItemId } from '../game/content/ids';
import { makeRecipePage } from '../game/inventory';
import { InventoryWindowContent } from './components/InventoryWindow/InventoryWindowContent';
import { createRecipe } from './uiRecipeBookTestHelpers';
import { mountUi, setupUiTestEnvironment } from './uiTestHelpers';

setupUiTestEnvironment();

describe('ui inventory window surfaces', () => {
  it('filters inventory items through category toggle buttons', async () => {
    const recipePage = makeRecipePage(
      createRecipe({
        id: 'craft-camp-spear',
        name: 'Camp Spear',
        output: {
          id: 'crafted-camp-spear',
          itemKey: ItemId.CampSpear,
          icon: getItemConfigByKey(ItemId.CampSpear)?.icon,
          name: 'Camp Spear',
          power: 3,
        },
      }),
    );
    const ui = await mountUi(
      <InventoryWindowContent
        inventory={[
          buildItemFromConfig(ItemId.TownKnife, { id: 'weapon-1' }),
          buildItemFromConfig(ItemId.TrailRation, { id: 'ration-1' }),
          buildItemFromConfig(ItemId.Cloth, {
            id: 'cloth-1',
            quantity: 3,
          }),
          buildItemFromConfig(ItemId.Gold, {
            id: 'gold-1',
            quantity: 12,
          }),
          buildItemFromConfig(ItemId.Stone, {
            id: 'stone-1',
            quantity: 2,
          }),
          recipePage,
        ]}
        equipment={{}}
        learnedRecipeIds={[]}
        onActivateItem={() => {}}
        onSellItem={() => {}}
        onContextItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    expect(
      ui.host.querySelector('button[aria-label="Equippable"]'),
    ).toBeTruthy();
    expect(
      ui.host.querySelector('button[aria-label="Consumable"]'),
    ).toBeTruthy();
    expect(
      ui.host.querySelector('button[aria-label="Materials"]'),
    ).toBeTruthy();
    expect(ui.host.querySelector('button[aria-label="Recipes"]')).toBeTruthy();
    expect(ui.host.querySelector('button[aria-label="Currency"]')).toBeTruthy();
    expect(
      ui.host.querySelector('button[aria-label="Resources"]'),
    ).toBeTruthy();
    expect(
      Array.from(
        ui.host.querySelectorAll(
          'button[aria-label="Equippable"], button[aria-label="Consumable"], button[aria-label="Materials"], button[aria-label="Recipes"], button[aria-label="Currency"], button[aria-label="Resources"]',
        ),
      ).every((button) => button.textContent === ''),
    ).toBe(true);
    expect(itemButtonCount(ui.host)).toBe(6);

    const equippableFilter = ui.host.querySelector(
      'button[aria-label="Equippable"]',
    );
    expect(equippableFilter).toBeTruthy();

    await act(async () => {
      equippableFilter?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(itemButtonCount(ui.host)).toBe(5);

    const disableAllButton = Array.from(
      ui.host.querySelectorAll('button'),
    ).find((button) => button.textContent === 'Disable all');
    expect(disableAllButton).toBeTruthy();

    await act(async () => {
      disableAllButton?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(itemButtonCount(ui.host)).toBe(0);
    expect(ui.host.textContent).toContain('No items match the active filters.');

    const enableAllButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Enable all',
    );
    expect(enableAllButton).toBeTruthy();

    await act(async () => {
      enableAllButton?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(itemButtonCount(ui.host)).toBe(6);

    await ui.unmount();
  });

  it('renders learned recipe pages in inventory with shared recipe slot colors', async () => {
    const recipePage = makeRecipePage(
      createRecipe({
        id: 'craft-camp-spear',
        name: 'Camp Spear',
        output: {
          id: 'crafted-camp-spear',
          itemKey: ItemId.CampSpear,
          icon: getItemConfigByKey(ItemId.CampSpear)?.icon,
          name: 'Camp Spear',
          power: 3,
        },
      }),
    );
    const ui = await mountUi(
      <InventoryWindowContent
        inventory={[recipePage]}
        equipment={{}}
        learnedRecipeIds={['craft-camp-spear']}
        onActivateItem={() => {}}
        onSellItem={() => {}}
        onContextItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    const compactButtons = Array.from(
      ui.host.querySelectorAll('button[data-size="compact"]'),
    );
    const recipeSlot = compactButtons[compactButtons.length - 1];
    const recipeIcon = recipeSlot?.querySelector('span[aria-label]');

    expect(recipeSlot?.getAttribute('style')).toContain(
      'border-color: rgb(248, 250, 252)',
    );
    expect(recipeSlot?.getAttribute('style')).toContain(
      'box-shadow: 0 0 0 1px #f8fafc33 inset',
    );
    expect(recipeSlot?.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(recipeIcon?.getAttribute('style')).toContain(
      'background-color: rgb(34, 197, 94)',
    );

    await ui.unmount();
  });
});

function itemButtonCount(host: HTMLElement) {
  return (
    host.querySelectorAll('button[data-size="compact"]').length -
    host.querySelectorAll(
      'button[aria-label="Equippable"], button[aria-label="Consumable"], button[aria-label="Materials"], button[aria-label="Recipes"], button[aria-label="Currency"], button[aria-label="Resources"]',
    ).length
  );
}
