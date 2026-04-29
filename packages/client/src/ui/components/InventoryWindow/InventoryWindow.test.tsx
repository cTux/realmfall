import { act } from 'react';
import { vi } from 'vitest';
import { buildItemFromConfig } from '../../../game/content/items';
import { ItemId } from '../../../game/content/ids';
import { mountUi, setupUiTestEnvironment } from '../../uiTestHelpers';
import { InventoryWindow } from './InventoryWindow';

setupUiTestEnvironment();

describe('InventoryWindow', () => {
  it('opens a single-select sort menu and forwards the selected mode', async () => {
    const onSort = vi.fn();
    const ui = await mountUi(
      <InventoryWindow
        position={{ x: 40, y: 40 }}
        onMove={() => {}}
        visible
        inventory={[buildItemFromConfig(ItemId.TownKnife, { id: 'weapon-1' })]}
        equipment={{}}
        learnedRecipeIds={[]}
        onSort={onSort}
        onActivateItem={() => {}}
        onSellItem={() => {}}
        onContextItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    const sortButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Sort'),
    );

    expect(sortButton).toBeTruthy();
    expect(ui.host.querySelector('input[type="checkbox"]')).toBeNull();

    await act(async () => {
      sortButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(ui.host.textContent).toContain('Type');
    expect(ui.host.textContent).toContain('Rarity');
    expect(ui.host.textContent).toContain('Tier');
    expect(ui.host.textContent).toContain('Name');
    expect(ui.host.querySelector('input[type="checkbox"]')).toBeNull();

    const rarityButton = Array.from(ui.host.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Rarity'),
    );

    expect(rarityButton).toBeTruthy();

    await act(async () => {
      rarityButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSort).toHaveBeenCalledWith('rarity');
    expect(ui.host.textContent).not.toContain('Type');

    await ui.unmount();
  });
});
