import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { t } from '../../../i18n';
import { toggleFavoriteRecipe } from '../../../game/crafting';
import type { InventorySortMode } from '../../../game/inventory';
import { craftRecipe } from '../../../game/stateCrafting';
import { forfeitCombat, startCombat } from '../../../game/stateCombat';
import {
  buyTownItem,
  getTownStock,
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
} from '../../../game/stateInventoryActions';
import {
  corruptInventoryItem,
  enchantInventoryItem,
  reforgeInventoryItem,
} from '../../../game/stateItemModificationActions';
import type { EnemyTypeKey, ItemKey } from '../../../game/content/ids';
import type { DebugEquipmentType } from '../../../game/stateDebug';
import {
  activateInventoryItem,
  equipItem,
  unequipItem,
  useItem as applyItemUse,
} from '../../../game/stateItemActions';
import type { GameState } from '../../../game/stateTypes';
import type { ItemRarity } from '../../../game/stateTypes';
import type { EnemyRarity } from '../../../game/types';
import {
  claimCurrentHex,
  healAtFactionNpc,
  interactWithStructure,
} from '../../../game/stateWorldActions';
import { createLoggedGameTransition } from './useLoggedGameCommand';

interface UseGameActionHandlersOptions {
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

type DebugStateModule = typeof import('../../../game/stateDebug');

export function useGameActionHandlers({
  paused,
  setGame,
  worldTimeMsRef,
}: UseGameActionHandlersOptions) {
  const applyGameTransition = useCallback(
    (transition: (state: GameState) => GameState) => {
      if (paused) {
        return;
      }

      applyTimedGameTransition(setGame, worldTimeMsRef, transition);
    },
    [paused, setGame, worldTimeMsRef],
  );

  const handleUnequip = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () =>
            t('game.log.command.unequipItem', {
              slotName: t(`ui.equipmentSlot.${slot}.label`),
            }),
          transition: (current) => unequipItem(current, slot),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleSort = useCallback(
    (mode: InventorySortMode = 'type') => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => t('game.log.command.sortInventory'),
          transition: (current) => sortInventory(current, mode),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleProspect = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.prospectInventory'),
        transition: prospectInventory,
      }),
    );
  }, [applyGameTransition]);

  const handleSellAll = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.sellAllItems'),
        transition: sellAllItems,
      }),
    );
  }, [applyGameTransition]);

  const handleProspectItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.prospectItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => prospectInventoryItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleSellItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.sellItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => sellInventoryItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleReforgeItem = useCallback(
    (itemId: string, statIndex: number) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.reforgeItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) =>
            reforgeInventoryItem(current, itemId, statIndex),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleEnchantItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.enchantItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => enchantInventoryItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleCorruptItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.corruptItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => corruptInventoryItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleInteract = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.interactWithStructure'),
        transition: interactWithStructure,
      }),
    );
  }, [applyGameTransition]);

  const handleClaimHex = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.claimHex'),
        transition: claimCurrentHex,
      }),
    );
  }, [applyGameTransition]);

  const handleHealTerritoryNpc = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.healTerritoryNpc'),
        transition: healAtFactionNpc,
      }),
    );
  }, [applyGameTransition]);

  const handleBuyTownItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.buyTownItem', {
              itemName: findTownStockItemName(current, itemId),
            }),
          transition: (current) => buyTownItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleActivateInventoryItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.activateInventoryItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => activateInventoryItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleEquipItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.equipItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => equipItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.useItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => applyItemUse(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleCraftRecipe = useCallback(
    (recipeId: string, count?: number | 'max') => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => t('game.log.command.craftRecipe'),
          transition: (current) => craftRecipe(current, recipeId, count),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleToggleFavoriteRecipe = useCallback(
    (recipeId: string) => {
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
    },
    [applyGameTransition],
  );

  const handleDropItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t('game.log.command.dropItem', {
              itemName: findInventoryItemName(current, itemId),
            }),
          transition: (current) => dropInventoryItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleDropEquippedItem = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () =>
            t('game.log.command.dropEquippedItem', {
              slotName: t(`ui.equipmentSlot.${slot}.label`),
            }),
          transition: (current) => dropEquippedItem(current, slot),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleTakeLootItem = useCallback(
    (itemId: string) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => t('game.log.command.takeLootItem'),
          transition: (current) => takeTileItem(current, itemId),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleTakeAllLoot = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.takeAllLoot'),
        transition: takeAllTileItems,
      }),
    );
  }, [applyGameTransition]);

  const handleSetItemLocked = useCallback(
    (itemId: string, locked: boolean) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: (current) =>
            t(
              locked
                ? 'game.log.command.lockItem'
                : 'game.log.command.unlockItem',
              {
                itemName: findInventoryItemName(current, itemId),
              },
            ),
          transition: (current) =>
            setInventoryItemLocked(current, itemId, locked),
        }),
      );
    },
    [applyGameTransition],
  );

  const handleStartCombat = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.startCombat'),
        transition: startCombat,
      }),
    );
  }, [applyGameTransition]);

  const handleForfeitCombat = useCallback(() => {
    applyGameTransition(
      createLoggedGameTransition({
        describe: () => t('game.log.command.forfeitCombat'),
        transition: forfeitCombat,
      }),
    );
  }, [applyGameTransition]);

  const handleCreateDebugEquipmentItem = useCallback(
    (type: DebugEquipmentType, rarity: ItemRarity) => {
      void loadStateDebugModule().then(
        ({ addDebugEquipmentItemToInventory }) => {
          applyGameTransition(
            createLoggedGameTransition({
              describe: () =>
                `You command: create a ${t(`ui.rarity.${rarity}`)} ${getDebugEquipmentTypeLabel(type)}.`,
              transition: (current) =>
                addDebugEquipmentItemToInventory(current, { rarity, type }),
            }),
          );
        },
      );
    },
    [applyGameTransition],
  );

  const handleCreateDebugDropItem = useCallback(
    (itemKey: ItemKey) => {
      void loadStateDebugModule().then(({ addDebugDropItemToInventory }) => {
        applyGameTransition(
          createLoggedGameTransition({
            describe: () =>
              `You command: create ${t(`game.item.${itemKey}.name`)}.`,
            transition: (current) =>
              addDebugDropItemToInventory(current, itemKey),
          }),
        );
      });
    },
    [applyGameTransition],
  );

  const handleSpawnDebugEnemyNearby = useCallback(
    (enemyTypeId: EnemyTypeKey, rarity: EnemyRarity) => {
      void loadStateDebugModule().then(({ spawnDebugEnemyNearby }) => {
        applyGameTransition(
          createLoggedGameTransition({
            describe: () =>
              `You command: spawn a ${t(`ui.rarity.${rarity}`)} ${t(`game.enemy.${enemyTypeId}.name`)} nearby.`,
            transition: (current) =>
              spawnDebugEnemyNearby(current, { enemyTypeId, rarity }),
          }),
        );
      });
    },
    [applyGameTransition],
  );

  const handleTriggerDebugBloodMoon = useCallback(() => {
    void loadStateDebugModule().then(({ forceDebugBloodMoon }) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => 'You command: force a blood moon.',
          transition: forceDebugBloodMoon,
        }),
      );
    });
  }, [applyGameTransition]);

  const handleTriggerDebugHarvestMoon = useCallback(() => {
    void loadStateDebugModule().then(({ forceDebugHarvestMoon }) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => 'You command: force a harvest moon.',
          transition: forceDebugHarvestMoon,
        }),
      );
    });
  }, [applyGameTransition]);

  const handleTriggerDebugEarthquake = useCallback(() => {
    void loadStateDebugModule().then(({ triggerDebugEarthquake }) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => 'You command: trigger an earthquake.',
          transition: triggerDebugEarthquake,
        }),
      );
    });
  }, [applyGameTransition]);

  const handleSetDebugMorning = useCallback(() => {
    void loadStateDebugModule().then(({ setDebugMorning }) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => 'You command: set the world to morning.',
          transition: setDebugMorning,
        }),
      );
    });
  }, [applyGameTransition]);

  const handleSetDebugNight = useCallback(() => {
    void loadStateDebugModule().then(({ setDebugNight }) => {
      applyGameTransition(
        createLoggedGameTransition({
          describe: () => 'You command: set the world to night.',
          transition: setDebugNight,
        }),
      );
    });
  }, [applyGameTransition]);

  return {
    applyGameTransition,
    handleActivateInventoryItem,
    handleBuyTownItem,
    handleClaimHex,
    handleCreateDebugDropItem,
    handleCreateDebugEquipmentItem,
    handleHealTerritoryNpc,
    handleCraftRecipe,
    handleDropEquippedItem,
    handleDropItem,
    handleEnchantItem,
    handleEquipItem,
    handleForfeitCombat,
    handleInteract,
    handleCorruptItem,
    handleProspect,
    handleProspectItem,
    handleReforgeItem,
    handleSellAll,
    handleSellItem,
    handleSetDebugMorning,
    handleSetDebugNight,
    handleSetItemLocked,
    handleSpawnDebugEnemyNearby,
    handleToggleFavoriteRecipe,
    handleSort,
    handleStartCombat,
    handleTakeAllLoot,
    handleTakeLootItem,
    handleTriggerDebugBloodMoon,
    handleTriggerDebugEarthquake,
    handleTriggerDebugHarvestMoon,
    handleUnequip,
    handleUseItem,
  };
}

function getDebugEquipmentTypeLabel(type: DebugEquipmentType) {
  return {
    weapon: 'weapon',
    offhand: 'offhand',
    armor: 'armor',
    artifact: 'artifact',
  }[type];
}

function loadStateDebugModule(): Promise<DebugStateModule> {
  return import('../../../game/stateDebug');
}

function applyTimedGameTransition(
  setGame: Dispatch<SetStateAction<GameState>>,
  worldTimeMsRef: MutableRefObject<number>,
  transition: (state: GameState) => GameState,
) {
  setGame((current) =>
    transition({ ...current, worldTimeMs: worldTimeMsRef.current }),
  );
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
