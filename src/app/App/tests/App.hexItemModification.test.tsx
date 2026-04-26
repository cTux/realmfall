import { act } from 'react';
import { getItemModificationCost } from '../../../game/itemModifications';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

const HEX_ITEM_MODIFICATION_TIMEOUT_MS = 2_000;

vi.setConfig({ testTimeout: HEX_ITEM_MODIFICATION_TIMEOUT_MS });

describe.skip('App hex item modification flow', () => {
  it('selects items from inventory and equipment for hex modification', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'mana-font',
      items: [],
    };
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        itemKey: 'gold',
        name: 'Gold',
        quantity: 500,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'weapon-1',
        slot: 'weapon',
        name: 'Arc Blade',
        quantity: 1,
        tier: 10,
        rarity: 'rare',
        power: 90,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];
    game.player.equipment.head = {
      id: 'armor-1',
      slot: 'head',
      name: 'Scout Hood',
      quantity: 1,
      tier: 6,
      rarity: 'uncommon',
      power: 0,
      defense: 8,
      maxHp: 4,
      healing: 0,
      hunger: 0,
    };

    const weaponCost = getItemModificationCost(
      game.player.inventory[1]!,
      'enchant',
    );
    const armorCost = getItemModificationCost(
      game.player.equipment.head!,
      'enchant',
    );

    loadEncryptedState.mockResolvedValue({
      game,
      ui: {
        windowShown: {
          hero: false,
          skills: false,
          recipes: false,
          hexInfo: true,
          equipment: true,
          inventory: true,
          loot: false,
          log: false,
          combat: false,
          settings: false,
        },
      },
    });

    const { host, root } = await renderApp();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await flushLazyModules();
    await flushLazyModules();

    const selectionSlot = host.querySelector(
      '[aria-label="Selected item for hex modification"]',
    ) as HTMLButtonElement | null;
    expect(selectionSlot).not.toBeNull();
    expect(findButton(host, 'Enchant')?.disabled).toBe(true);
    expect(host.textContent).toContain('Select an equippable item first.');

    await act(async () => {
      selectionSlot?.click();
    });

    const inventoryWeapon = host.querySelector('[aria-label="weapon"]')
      ?.parentElement as HTMLButtonElement | null;
    expect(inventoryWeapon).not.toBeNull();

    await act(async () => {
      inventoryWeapon?.click();
    });

    expect(host.textContent).toContain('Arc Blade');
    expect(host.textContent).toContain(`Cost: ${weaponCost} gold`);
    expect(findButton(host, 'Enchant')?.disabled).toBe(false);

    await act(async () => {
      selectionSlot?.click();
    });

    const equippedArmor = host.querySelector('[aria-label="armor"]')
      ?.parentElement as HTMLButtonElement | null;
    expect(equippedArmor).not.toBeNull();

    await act(async () => {
      equippedArmor?.click();
    });

    expect(host.textContent).toContain('Scout Hood');
    expect(host.textContent).toContain(`Cost: ${armorCost} gold`);
    expect(findButton(host, 'Enchant')?.disabled).toBe(false);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('disables the hex modification action when the player lacks gold', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'mana-font',
      items: [],
    };
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        itemKey: 'gold',
        name: 'Gold',
        quantity: 5,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'weapon-1',
        slot: 'weapon',
        name: 'Poor Blade',
        quantity: 1,
        tier: 10,
        rarity: 'epic',
        power: 90,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const enchantCost = getItemModificationCost(
      game.player.inventory[1]!,
      'enchant',
    );

    loadEncryptedState.mockResolvedValue({
      game,
      ui: {
        windowShown: {
          hero: false,
          skills: false,
          recipes: false,
          hexInfo: true,
          equipment: false,
          inventory: true,
          loot: false,
          log: false,
          combat: false,
          settings: false,
        },
      },
    });

    const { host, root } = await renderApp();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await flushLazyModules();
    await flushLazyModules();

    const selectionSlot = host.querySelector(
      '[aria-label="Selected item for hex modification"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      selectionSlot?.click();
    });

    const inventoryWeapon = host.querySelector('[aria-label="weapon"]')
      ?.parentElement as HTMLButtonElement | null;

    await act(async () => {
      inventoryWeapon?.click();
    });

    expect(host.textContent).toContain('Poor Blade');
    expect(host.textContent).toContain(`Cost: ${enchantCost} gold`);
    expect(host.textContent).toContain(
      `You need ${enchantCost} gold for this action.`,
    );
    expect(findButton(host, 'Enchant')?.disabled).toBe(true);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

function findButton(host: HTMLElement, label: string) {
  return Array.from(host.querySelectorAll('button')).find(
    (button) => button.textContent === label,
  ) as HTMLButtonElement | undefined;
}
