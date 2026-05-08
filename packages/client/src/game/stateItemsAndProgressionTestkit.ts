import {
  addCombatConsumables,
  addHomeScroll,
  addInventoryConfigItem,
  createEquipmentItem,
  createItemsAndProgressionGame,
  findHomeScrollDrop,
  hasInventoryItem,
  itemQuantity,
  resolveEnemyEncounter,
  seedEnemyEncounter,
  setActiveCombat,
} from './stateItemsAndProgressionTestHelpers';

export class StateItemsAndProgressionTestkit {
  readonly actions = {
    addCombatConsumables: (...args: Parameters<typeof addCombatConsumables>) =>
      addCombatConsumables(...args),
    addHomeScroll: (...args: Parameters<typeof addHomeScroll>) =>
      addHomeScroll(...args),
    addInventoryConfigItem: (
      ...args: Parameters<typeof addInventoryConfigItem>
    ) => addInventoryConfigItem(...args),
    createEquipmentItem: (...args: Parameters<typeof createEquipmentItem>) =>
      createEquipmentItem(...args),
    createItemsAndProgressionGame: (
      ...args: Parameters<typeof createItemsAndProgressionGame>
    ) => createItemsAndProgressionGame(...args),
    findHomeScrollDrop: (...args: Parameters<typeof findHomeScrollDrop>) =>
      findHomeScrollDrop(...args),
    hasInventoryItem: (...args: Parameters<typeof hasInventoryItem>) =>
      hasInventoryItem(...args),
    itemQuantity: (...args: Parameters<typeof itemQuantity>) =>
      itemQuantity(...args),
    resolveEnemyEncounter: (
      ...args: Parameters<typeof resolveEnemyEncounter>
    ) => resolveEnemyEncounter(...args),
    seedEnemyEncounter: (...args: Parameters<typeof seedEnemyEncounter>) =>
      seedEnemyEncounter(...args),
    setActiveCombat: (...args: Parameters<typeof setActiveCombat>) =>
      setActiveCombat(...args),
  };
}

export * from './stateItemsAndProgressionTestHelpers';
