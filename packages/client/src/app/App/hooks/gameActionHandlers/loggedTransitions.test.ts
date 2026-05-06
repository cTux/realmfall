import { createGame } from '../../../../game/stateFactory';
import { t } from '../../../../i18n';
import {
  createEquipmentSlotLoggedTransition,
  createInventoryItemLoggedTransition,
  createStaticLoggedTransition,
  createTownStockItemLoggedTransition,
} from './loggedTransitions';

describe('loggedTransitions helpers', () => {
  it('logs the resolved inventory item name for inventory commands', () => {
    const game = createGame(2, 'logged-transition-inventory-name');
    const itemId = game.player.inventory[0]!.id;
    const itemName = game.player.inventory[0]!.name;
    const run = createInventoryItemLoggedTransition({
      itemId,
      logKey: 'game.log.command.sellItem',
      transition: (current) => ({ ...current, turn: current.turn + 1 }),
    });

    const next = run(game);

    expect(next.logs[0]?.text).toContain(itemName);
  });

  it('falls back when the referenced item name is unavailable', () => {
    const game = createGame(2, 'logged-transition-fallback-item');
    const fallbackItemName = t('game.log.command.fallback.item');
    const inventoryRun = createInventoryItemLoggedTransition({
      itemId: 'missing-item',
      logKey: 'game.log.command.sellItem',
      transition: (current) => ({ ...current, turn: current.turn + 1 }),
    });
    const townRun = createTownStockItemLoggedTransition({
      itemId: 'missing-town-item',
      logKey: 'game.log.command.buyTownItem',
      transition: (current) => ({ ...current, turn: current.turn + 1 }),
    });

    expect(inventoryRun(game).logs[0]?.text).toContain(fallbackItemName);
    expect(townRun(game).logs[0]?.text).toContain(fallbackItemName);
  });

  it('logs the translated equipment-slot label for slot commands', () => {
    const game = createGame(2, 'logged-transition-slot-label');
    const slotName = t('ui.equipmentSlot.weapon.label');
    const run = createEquipmentSlotLoggedTransition({
      logKey: 'game.log.command.unequipItem',
      slot: 'weapon',
      transition: (current) => ({ ...current, turn: current.turn + 1 }),
    });

    const next = run(game);

    expect(next.logs[0]?.text).toContain(slotName);
  });

  it('keeps static command descriptions centralized', () => {
    const game = createGame(2, 'logged-transition-static-command');
    const description = t('game.log.command.sortInventory');
    const run = createStaticLoggedTransition({
      description,
      transition: (current) => ({ ...current, turn: current.turn + 1 }),
    });

    const next = run(game);

    expect(next.logs[0]?.text).toContain(description);
  });
});
