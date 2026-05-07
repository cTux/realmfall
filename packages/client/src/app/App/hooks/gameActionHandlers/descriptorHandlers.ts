import { t } from '../../../../i18n';
import { toggleFavoriteRecipe } from '../../../../game/crafting';
import type { InventorySortMode } from '../../../../game/inventory';
import { craftRecipe } from '../../../../game/stateCrafting';
import { forfeitCombat } from '../../../../game/stateCombat';
import type { EnemyTypeKey, ItemKey } from '../../../../game/content/ids';
import type { DebugEquipmentType } from '../../../../game/stateDebug';
import {
  buyTownItem,
  dropEquippedItem,
  dropInventoryItem,
  prospectInventory,
  prospectInventoryItem,
  sellAllItems,
  sellInventoryItem,
  setInventoryItemLocked,
  sortInventory,
  takeAllTileItems,
  takeTileItem,
} from '../../../../game/stateInventoryActions';
import {
  corruptInventoryItem,
  enchantInventoryItem,
  reforgeInventoryItem,
} from '../../../../game/stateItemModificationActions';
import {
  activateInventoryItem,
  equipItem,
  unequipItem,
  useItem as applyItemUse,
} from '../../../../game/stateItemActions';
import type {
  EquipmentSlot,
  GameState,
  ItemRarity,
} from '../../../../game/stateTypes';
import type { EnemyRarity } from '../../../../game/stateTypes';
import {
  claimCurrentHex,
  healAtFactionNpc,
  interactWithStructure,
} from '../../../../game/stateWorldActions';
import { createLoggedGameTransition } from '../useLoggedGameCommand';
import {
  createEquipmentSlotLoggedTransition,
  createInventoryItemLoggedTransition,
  createStaticLoggedTransition,
  createTownStockItemLoggedTransition,
} from './loggedTransitions';

type ApplyGameTransition = (
  transition: (state: GameState) => GameState,
) => void;
type CommandArgs = readonly unknown[];
type DebugStateModule = typeof import('../../../../game/stateDebug');

interface InventoryItemCommandHandlers {
  handleActivateInventoryItem: (itemId: string) => void;
  handleCorruptItem: (itemId: string) => void;
  handleDropItem: (itemId: string) => void;
  handleEnchantItem: (itemId: string) => void;
  handleEquipItem: (itemId: string) => void;
  handleProspectItem: (itemId: string) => void;
  handleReforgeItem: (itemId: string, statIndex: number) => void;
  handleSellItem: (itemId: string) => void;
  handleSetItemLocked: (itemId: string, locked: boolean) => void;
  handleUseItem: (itemId: string) => void;
}

interface TownStockItemCommandHandlers {
  handleBuyTownItem: (itemId: string) => void;
}

interface StaticCommandHandlers {
  handleClaimHex: () => void;
  handleCraftRecipe: (recipeId: string, count?: number | 'max') => void;
  handleForfeitCombat: () => void;
  handleHealTerritoryNpc: () => void;
  handleInteract: () => void;
  handleProspect: () => void;
  handleSellAll: () => void;
  handleSort: (mode?: InventorySortMode) => void;
  handleTakeAllLoot: () => void;
  handleTakeLootItem: (itemId: string) => void;
}

interface EquipmentSlotCommandHandlers {
  handleDropEquippedItem: (slot: EquipmentSlot) => void;
  handleUnequip: (slot: EquipmentSlot) => void;
}

interface DebugCommandHandlers {
  handleCreateDebugDropItem: (itemKey: ItemKey) => void;
  handleCreateDebugEquipmentItem: (
    type: DebugEquipmentType,
    rarity: ItemRarity,
  ) => void;
  handleSetDebugMorning: () => void;
  handleSetDebugNight: () => void;
  handleSpawnDebugEnemyNearby: (
    enemyTypeId: EnemyTypeKey,
    rarity: EnemyRarity,
  ) => void;
  handleTriggerDebugBloodMoon: () => void;
  handleTriggerDebugEarthquake: () => void;
  handleTriggerDebugHarvestMoon: () => void;
}

interface InventoryItemCommandDescriptor<Args extends CommandArgs> {
  getItemId: (...args: Args) => string;
  getLogKey: (...args: Args) => string;
  transition: (state: GameState, ...args: Args) => GameState;
}

interface TownStockItemCommandDescriptor<Args extends CommandArgs> {
  getItemId: (...args: Args) => string;
  getLogKey: (...args: Args) => string;
  transition: (state: GameState, ...args: Args) => GameState;
}

interface StaticCommandDescriptor<Args extends CommandArgs> {
  describe: (...args: Args) => string;
  transition: (state: GameState, ...args: Args) => GameState;
}

interface EquipmentSlotCommandDescriptor {
  logKey: string;
  transition: (state: GameState, slot: EquipmentSlot) => GameState;
}

interface DebugCommandDescriptor<Args extends CommandArgs> {
  describe: (...args: Args) => string;
  resolveTransition: (
    module: DebugStateModule,
    ...args: Args
  ) => (state: GameState) => GameState;
}

const inventoryItemCommandDescriptors = {
  handleActivateInventoryItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.activateInventoryItem',
    transition: (state, itemId) => activateInventoryItem(state, itemId),
  },
  handleCorruptItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.corruptItem',
    transition: (state, itemId) => corruptInventoryItem(state, itemId),
  },
  handleDropItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.dropItem',
    transition: (state, itemId) => dropInventoryItem(state, itemId),
  },
  handleEnchantItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.enchantItem',
    transition: (state, itemId) => enchantInventoryItem(state, itemId),
  },
  handleEquipItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.equipItem',
    transition: (state, itemId) => equipItem(state, itemId),
  },
  handleProspectItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.prospectItem',
    transition: (state, itemId) => prospectInventoryItem(state, itemId),
  },
  handleReforgeItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.reforgeItem',
    transition: (state, itemId, statIndex: number) =>
      reforgeInventoryItem(state, itemId, statIndex),
  },
  handleSellItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.sellItem',
    transition: (state, itemId) => sellInventoryItem(state, itemId),
  },
  handleSetItemLocked: {
    getItemId: (itemId: string) => itemId,
    getLogKey: (_itemId: string, locked: boolean) =>
      locked ? 'game.log.command.lockItem' : 'game.log.command.unlockItem',
    transition: (state, itemId, locked: boolean) =>
      setInventoryItemLocked(state, itemId, locked),
  },
  handleUseItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.useItem',
    transition: (state, itemId) => applyItemUse(state, itemId),
  },
} satisfies {
  [K in keyof InventoryItemCommandHandlers]: InventoryItemCommandDescriptor<
    Parameters<InventoryItemCommandHandlers[K]>
  >;
};

const townStockItemCommandDescriptors = {
  handleBuyTownItem: {
    getItemId: (itemId: string) => itemId,
    getLogKey: () => 'game.log.command.buyTownItem',
    transition: (state, itemId) => buyTownItem(state, itemId),
  },
} satisfies {
  [K in keyof TownStockItemCommandHandlers]: TownStockItemCommandDescriptor<
    Parameters<TownStockItemCommandHandlers[K]>
  >;
};

const staticCommandDescriptors = {
  handleClaimHex: {
    describe: () => t('game.log.command.claimHex'),
    transition: claimCurrentHex,
  },
  handleCraftRecipe: {
    describe: () => t('game.log.command.craftRecipe'),
    transition: (state, recipeId: string, count?: number | 'max') =>
      craftRecipe(state, recipeId, count),
  },
  handleForfeitCombat: {
    describe: () => t('game.log.command.forfeitCombat'),
    transition: forfeitCombat,
  },
  handleHealTerritoryNpc: {
    describe: () => t('game.log.command.healTerritoryNpc'),
    transition: healAtFactionNpc,
  },
  handleInteract: {
    describe: () => t('game.log.command.interactWithStructure'),
    transition: interactWithStructure,
  },
  handleProspect: {
    describe: () => t('game.log.command.prospectInventory'),
    transition: prospectInventory,
  },
  handleSellAll: {
    describe: () => t('game.log.command.sellAllItems'),
    transition: sellAllItems,
  },
  handleSort: {
    describe: () => t('game.log.command.sortInventory'),
    transition: (state, mode: InventorySortMode = 'type') =>
      sortInventory(state, mode),
  },
  handleTakeAllLoot: {
    describe: () => t('game.log.command.takeAllLoot'),
    transition: takeAllTileItems,
  },
  handleTakeLootItem: {
    describe: () => t('game.log.command.takeLootItem'),
    transition: (state, itemId: string) => takeTileItem(state, itemId),
  },
} satisfies {
  [K in keyof StaticCommandHandlers]: StaticCommandDescriptor<
    Parameters<StaticCommandHandlers[K]>
  >;
};

const equipmentSlotCommandDescriptors = {
  handleDropEquippedItem: {
    logKey: 'game.log.command.dropEquippedItem',
    transition: dropEquippedItem,
  },
  handleUnequip: {
    logKey: 'game.log.command.unequipItem',
    transition: unequipItem,
  },
} satisfies {
  [K in keyof EquipmentSlotCommandHandlers]: EquipmentSlotCommandDescriptor;
};

const debugCommandDescriptors = {
  handleCreateDebugDropItem: {
    describe: (itemKey: ItemKey) =>
      `You command: create ${t(`game.item.${itemKey}.name`)}.`,
    resolveTransition: (module, itemKey) => (state) =>
      module.addDebugDropItemToInventory(state, itemKey),
  },
  handleCreateDebugEquipmentItem: {
    describe: (type: DebugEquipmentType, rarity: ItemRarity) =>
      `You command: create a ${t(`ui.rarity.${rarity}`)} ${getDebugEquipmentTypeLabel(type)}.`,
    resolveTransition: (module, type, rarity) => (state) =>
      module.addDebugEquipmentItemToInventory(state, { rarity, type }),
  },
  handleSetDebugMorning: {
    describe: () => 'You command: set the world to morning.',
    resolveTransition: (module) => module.setDebugMorning,
  },
  handleSetDebugNight: {
    describe: () => 'You command: set the world to night.',
    resolveTransition: (module) => module.setDebugNight,
  },
  handleSpawnDebugEnemyNearby: {
    describe: (enemyTypeId: EnemyTypeKey, rarity: EnemyRarity) =>
      `You command: spawn a ${t(`ui.rarity.${rarity}`)} ${t(`game.enemy.${enemyTypeId}.name`)} nearby.`,
    resolveTransition: (module, enemyTypeId, rarity) => (state) =>
      module.spawnDebugEnemyNearby(state, { enemyTypeId, rarity }),
  },
  handleTriggerDebugBloodMoon: {
    describe: () => 'You command: force a blood moon.',
    resolveTransition: (module) => module.forceDebugBloodMoon,
  },
  handleTriggerDebugEarthquake: {
    describe: () => 'You command: trigger an earthquake.',
    resolveTransition: (module) => module.triggerDebugEarthquake,
  },
  handleTriggerDebugHarvestMoon: {
    describe: () => 'You command: force a harvest moon.',
    resolveTransition: (module) => module.forceDebugHarvestMoon,
  },
} satisfies {
  [K in keyof DebugCommandHandlers]: DebugCommandDescriptor<
    Parameters<DebugCommandHandlers[K]>
  >;
};

export function buildInventoryItemCommandHandlers(
  applyGameTransition: ApplyGameTransition,
): InventoryItemCommandHandlers {
  return {
    handleActivateInventoryItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleActivateInventoryItem,
    ),
    handleCorruptItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleCorruptItem,
    ),
    handleDropItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleDropItem,
    ),
    handleEnchantItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleEnchantItem,
    ),
    handleEquipItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleEquipItem,
    ),
    handleProspectItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleProspectItem,
    ),
    handleReforgeItem: createInventoryItemCommandHandler<
      Parameters<InventoryItemCommandHandlers['handleReforgeItem']>
    >(applyGameTransition, inventoryItemCommandDescriptors.handleReforgeItem),
    handleSellItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleSellItem,
    ),
    handleSetItemLocked: createInventoryItemCommandHandler<
      Parameters<InventoryItemCommandHandlers['handleSetItemLocked']>
    >(applyGameTransition, inventoryItemCommandDescriptors.handleSetItemLocked),
    handleUseItem: createInventoryItemCommandHandler(
      applyGameTransition,
      inventoryItemCommandDescriptors.handleUseItem,
    ),
  };
}

export function buildTownStockItemCommandHandlers(
  applyGameTransition: ApplyGameTransition,
): TownStockItemCommandHandlers {
  return {
    handleBuyTownItem: createTownStockItemCommandHandler(
      applyGameTransition,
      townStockItemCommandDescriptors.handleBuyTownItem,
    ),
  };
}

export function buildStaticCommandHandlers(
  applyGameTransition: ApplyGameTransition,
): StaticCommandHandlers {
  return {
    handleClaimHex: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleClaimHex,
    ),
    handleCraftRecipe: createStaticCommandHandler<
      Parameters<StaticCommandHandlers['handleCraftRecipe']>
    >(applyGameTransition, staticCommandDescriptors.handleCraftRecipe),
    handleForfeitCombat: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleForfeitCombat,
    ),
    handleHealTerritoryNpc: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleHealTerritoryNpc,
    ),
    handleInteract: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleInteract,
    ),
    handleProspect: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleProspect,
    ),
    handleSellAll: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleSellAll,
    ),
    handleSort: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleSort,
    ),
    handleTakeAllLoot: createStaticCommandHandler(
      applyGameTransition,
      staticCommandDescriptors.handleTakeAllLoot,
    ),
    handleTakeLootItem: createStaticCommandHandler<
      Parameters<StaticCommandHandlers['handleTakeLootItem']>
    >(applyGameTransition, staticCommandDescriptors.handleTakeLootItem),
  };
}

export function buildEquipmentSlotCommandHandlers(
  applyGameTransition: ApplyGameTransition,
): EquipmentSlotCommandHandlers {
  return {
    handleDropEquippedItem: createEquipmentSlotCommandHandler(
      applyGameTransition,
      equipmentSlotCommandDescriptors.handleDropEquippedItem,
    ),
    handleUnequip: createEquipmentSlotCommandHandler(
      applyGameTransition,
      equipmentSlotCommandDescriptors.handleUnequip,
    ),
  };
}

export function buildDebugCommandHandlers(
  applyGameTransition: ApplyGameTransition,
  loadStateDebugModule: () => Promise<DebugStateModule> = loadDefaultStateDebugModule,
): DebugCommandHandlers {
  return {
    handleCreateDebugDropItem: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleCreateDebugDropItem,
      loadStateDebugModule,
    ),
    handleCreateDebugEquipmentItem: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleCreateDebugEquipmentItem,
      loadStateDebugModule,
    ),
    handleSetDebugMorning: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleSetDebugMorning,
      loadStateDebugModule,
    ),
    handleSetDebugNight: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleSetDebugNight,
      loadStateDebugModule,
    ),
    handleSpawnDebugEnemyNearby: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleSpawnDebugEnemyNearby,
      loadStateDebugModule,
    ),
    handleTriggerDebugBloodMoon: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleTriggerDebugBloodMoon,
      loadStateDebugModule,
    ),
    handleTriggerDebugEarthquake: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleTriggerDebugEarthquake,
      loadStateDebugModule,
    ),
    handleTriggerDebugHarvestMoon: createDebugCommandHandler(
      applyGameTransition,
      debugCommandDescriptors.handleTriggerDebugHarvestMoon,
      loadStateDebugModule,
    ),
  };
}

export function createToggleFavoriteRecipeHandler(
  applyGameTransition: ApplyGameTransition,
) {
  return (recipeId: string) => {
    applyGameTransition((current) => {
      const next = {
        ...current,
        player: {
          ...current.player,
          favoriteRecipeIds: [...current.player.favoriteRecipeIds],
        },
      };
      toggleFavoriteRecipe(next, recipeId);
      return next;
    });
  };
}

function createInventoryItemCommandHandler<Args extends CommandArgs>(
  applyGameTransition: ApplyGameTransition,
  descriptor: InventoryItemCommandDescriptor<Args>,
) {
  return (...args: Args) => {
    const itemId = descriptor.getItemId(...args);
    applyGameTransition(
      createInventoryItemLoggedTransition({
        itemId,
        logKey: descriptor.getLogKey(...args),
        transition: (state) => descriptor.transition(state, ...args),
      }),
    );
  };
}

function createTownStockItemCommandHandler<Args extends CommandArgs>(
  applyGameTransition: ApplyGameTransition,
  descriptor: TownStockItemCommandDescriptor<Args>,
) {
  return (...args: Args) => {
    const itemId = descriptor.getItemId(...args);
    applyGameTransition(
      createTownStockItemLoggedTransition({
        itemId,
        logKey: descriptor.getLogKey(...args),
        transition: (state) => descriptor.transition(state, ...args),
      }),
    );
  };
}

function createStaticCommandHandler<Args extends CommandArgs>(
  applyGameTransition: ApplyGameTransition,
  descriptor: StaticCommandDescriptor<Args>,
) {
  return (...args: Args) => {
    applyGameTransition(
      createStaticLoggedTransition({
        description: descriptor.describe(...args),
        transition: (state) => descriptor.transition(state, ...args),
      }),
    );
  };
}

function createEquipmentSlotCommandHandler(
  applyGameTransition: ApplyGameTransition,
  descriptor: EquipmentSlotCommandDescriptor,
) {
  return (slot: EquipmentSlot) => {
    applyGameTransition(
      createEquipmentSlotLoggedTransition({
        logKey: descriptor.logKey,
        slot,
        transition: descriptor.transition,
      }),
    );
  };
}

function createDebugCommandHandler<Args extends CommandArgs>(
  applyGameTransition: ApplyGameTransition,
  descriptor: DebugCommandDescriptor<Args>,
  loadStateDebugModule: () => Promise<DebugStateModule>,
) {
  return (...args: Args) => {
    void loadStateDebugModule().then((module) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => descriptor.describe(...args),
          transition: descriptor.resolveTransition(module, ...args),
        }),
      );
    });
  };
}

function getDebugEquipmentTypeLabel(type: DebugEquipmentType) {
  return {
    artifact: 'artifact',
    armor: 'armor',
    offhand: 'offhand',
    weapon: 'weapon',
  }[type];
}

function loadDefaultStateDebugModule(): Promise<DebugStateModule> {
  return import('../../../../game/stateDebug');
}
