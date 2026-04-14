import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  buyTownItem,
  claimCurrentHex,
  craftRecipe,
  createGame,
  dropEquippedItem,
  dropInventoryItem,
  equipItem,
  interactWithStructure,
  moveAlongSafePath,
  moveToTile,
  progressCombat,
  prospectInventory,
  sellAllItems,
  setHomeHex,
  sortInventory,
  startCombat,
  syncBloodMoon,
  syncPlayerStatusEffects,
  takeAllTileItems,
  takeTileItem,
  unequipItem,
  type EquipmentSlot,
  type GameState,
  type HexCoord,
} from '../../game/state';
import { useItem as applyItemUse } from '../../game/state';
import { WORLD_RADIUS } from '../constants';

const initialState = createGame(WORLD_RADIUS);

function withWorldTime(state: GameState, worldTimeMs?: number) {
  if (worldTimeMs == null) return state;
  return {
    ...state,
    worldTimeMs,
  };
}

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    hydrateGame: (_state, action: PayloadAction<GameState>) => action.payload,
    setGameState: (_state, action: PayloadAction<GameState>) => action.payload,
    syncBloodMoonAtTime: (
      state,
      action: PayloadAction<{ worldTimeMinutes: number; worldTimeMs: number }>,
    ) =>
      syncBloodMoon(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.worldTimeMinutes,
      ),
    syncPlayerStatusEffectsAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs: number }>,
    ) => syncPlayerStatusEffects(state, action.payload.worldTimeMs),
    setHomeHex: (state) => setHomeHex(state),
    moveToTileAtTime: (
      state,
      action: PayloadAction<{ target: HexCoord; worldTimeMs?: number }>,
    ) =>
      moveToTile(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.target,
      ),
    moveAlongSafePathAtTime: (
      state,
      action: PayloadAction<{ target: HexCoord; worldTimeMs?: number }>,
    ) =>
      moveAlongSafePath(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.target,
      ),
    unequipItemAtTime: (
      state,
      action: PayloadAction<{ slot: EquipmentSlot; worldTimeMs?: number }>,
    ) =>
      unequipItem(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.slot,
      ),
    sortInventoryAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) => sortInventory(withWorldTime(state, action.payload.worldTimeMs)),
    prospectInventoryAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) => prospectInventory(withWorldTime(state, action.payload.worldTimeMs)),
    sellAllItemsAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) => sellAllItems(withWorldTime(state, action.payload.worldTimeMs)),
    interactWithStructureAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) =>
      interactWithStructure(withWorldTime(state, action.payload.worldTimeMs)),
    claimCurrentHexAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) => claimCurrentHex(withWorldTime(state, action.payload.worldTimeMs)),
    buyTownItemAtTime: (
      state,
      action: PayloadAction<{ itemId: string; worldTimeMs?: number }>,
    ) =>
      buyTownItem(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.itemId,
      ),
    equipItemAtTime: (
      state,
      action: PayloadAction<{ itemId: string; worldTimeMs?: number }>,
    ) =>
      equipItem(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.itemId,
      ),
    useItemAtTime: (
      state,
      action: PayloadAction<{ itemId: string; worldTimeMs?: number }>,
    ) =>
      applyItemUse(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.itemId,
      ),
    craftRecipeAtTime: (
      state,
      action: PayloadAction<{ recipeId: string; worldTimeMs?: number }>,
    ) =>
      craftRecipe(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.recipeId,
      ),
    dropInventoryItemAtTime: (
      state,
      action: PayloadAction<{ itemId: string; worldTimeMs?: number }>,
    ) =>
      dropInventoryItem(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.itemId,
      ),
    dropEquippedItemAtTime: (
      state,
      action: PayloadAction<{ slot: EquipmentSlot; worldTimeMs?: number }>,
    ) =>
      dropEquippedItem(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.slot,
      ),
    takeTileItemAtTime: (
      state,
      action: PayloadAction<{ itemId: string; worldTimeMs?: number }>,
    ) =>
      takeTileItem(
        withWorldTime(state, action.payload.worldTimeMs),
        action.payload.itemId,
      ),
    takeAllTileItemsAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) => takeAllTileItems(withWorldTime(state, action.payload.worldTimeMs)),
    startCombatAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) => startCombat(withWorldTime(state, action.payload.worldTimeMs)),
    progressCombatAtTime: (
      state,
      action: PayloadAction<{ worldTimeMs?: number }>,
    ) => progressCombat(withWorldTime(state, action.payload.worldTimeMs)),
  },
});

export const gameActions = gameSlice.actions;
export const gameReducer = gameSlice.reducer;
