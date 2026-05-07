import { getTownStock } from '../../../../game/stateInventoryActions';
import type { EquipmentSlot, GameState } from '../../../../game/stateTypes';
import { t } from '../../../../i18n';
import { createLoggedGameTransition } from '../useLoggedGameCommand';

interface StaticLoggedTransitionOptions {
  description: string;
  transition: (state: GameState) => GameState;
}

interface InventoryItemLoggedTransitionOptions {
  itemId: string;
  logKey: string;
  transition: (state: GameState, itemId: string) => GameState;
}

interface TownStockItemLoggedTransitionOptions {
  itemId: string;
  logKey: string;
  transition: (state: GameState, itemId: string) => GameState;
}

interface EquipmentSlotLoggedTransitionOptions {
  logKey: string;
  slot: EquipmentSlot;
  transition: (state: GameState, slot: EquipmentSlot) => GameState;
}

export function createStaticLoggedTransition({
  description,
  transition,
}: StaticLoggedTransitionOptions) {
  return createLoggedGameTransition({
    describe: () => description,
    transition,
  });
}

export function createInventoryItemLoggedTransition({
  itemId,
  logKey,
  transition,
}: InventoryItemLoggedTransitionOptions) {
  return createLoggedGameTransition({
    describe: (current) =>
      t(logKey, {
        itemName: findInventoryItemName(current, itemId),
      }),
    transition: (current) => transition(current, itemId),
  });
}

export function createTownStockItemLoggedTransition({
  itemId,
  logKey,
  transition,
}: TownStockItemLoggedTransitionOptions) {
  return createLoggedGameTransition({
    describe: (current) =>
      t(logKey, {
        itemName: findTownStockItemName(current, itemId),
      }),
    transition: (current) => transition(current, itemId),
  });
}

export function createEquipmentSlotLoggedTransition({
  logKey,
  slot,
  transition,
}: EquipmentSlotLoggedTransitionOptions) {
  return createLoggedGameTransition({
    describe: () =>
      t(logKey, {
        slotName: t(`ui.equipmentSlot.${slot}.label`),
      }),
    transition: (current) => transition(current, slot),
  });
}

function findInventoryItemName(state: GameState, itemId: string) {
  return (
    state.player.inventory.find((item) => item.id === itemId)?.name ??
    t('game.log.command.fallback.item')
  );
}

function findTownStockItemName(state: GameState, itemId: string) {
  return (
    getTownStock(state).find((entry) => entry.item.id === itemId)?.item.name ??
    t('game.log.command.fallback.item')
  );
}
