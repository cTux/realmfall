import { HARVEST_MOON_RESOURCE_CHANCES } from './config';

export { hexAtPoint, hexDistance } from './hex';
export type { HexCoord } from './hex';
export type {
  AbilityDefinition,
  AbilityId,
  CombatActorState,
  CombatCastState,
  CombatState,
  Enemy,
  Equipment,
  EquipmentSlot,
  GameState,
  GatheringStructureType,
  Item,
  ItemRarity,
  LogEntry,
  LogKind,
  LogRichSegment,
  Player,
  PlayerStatusEffect,
  RecipeBookEntry,
  RecipeDefinition,
  RecipeRequirement,
  SecondaryStatKey,
  SkillName,
  SkillProgress,
  StatusEffectId,
  StructureType,
  Terrain,
  TerritoryNpc,
  TileClaim,
  Tile,
  TownStockEntry,
} from './types';
export { Skill } from './types';
export { EQUIPMENT_SLOTS, LOG_KINDS, RARITY_ORDER, SKILL_NAMES } from './types';
export {
  gatheringBonusChance,
  gatheringYieldBonus,
  getPlayerCombatStats,
  getPlayerOverview,
  getPlayerProgressionSummary,
  skillLevelThreshold,
} from './progression';
export {
  canEquipItem,
  canSellItem,
  canUseItem,
  getGoldAmount,
  isEquippableItem,
  isRecipePage,
  makeGoldStack,
} from './inventory';
export {
  enemyRarityIndex,
  getEnemyConfig,
  getItemConfig,
  getItemConfigByKey,
  getStructureConfig,
  isAnimalEnemyType,
} from './stateSelectors';
export { createFreshLogsAtTime } from './logs';
export {
  describeStructure,
  isGatheringStructure,
  structureActionLabel,
} from './world';
export {
  getCurrentTile,
  getEnemiesAt,
  getEnemyAt,
  getHostileEnemyIds,
  getPlayerClaimedTiles,
  getTileAt,
  getVisibleTiles,
} from './stateWorldQueries';
export type { VisibleTilesState } from './stateWorldQueries';
export { getCurrentHexClaimStatus } from './stateClaims';
export { getCurrentHexFactionNpcHealStatus } from './stateFactionNpc';
export { getSafePathToTile } from './statePathfinding';
export { createGame } from './stateFactory';
export { moveAlongSafePath, moveToTile } from './stateMovement';
export {
  claimCurrentHex,
  healAtFactionNpc,
  interactWithStructure,
  setHomeHex,
} from './stateWorldActions';
export {
  craftRecipe,
  getRecipeBookEntries,
  getRecipeBookRecipes,
} from './stateCrafting';
export {
  buyTownItem,
  dropEquippedItem,
  dropInventoryItem,
  getTownStock,
  getTownStockForDay,
  hasEquippableInventoryItems,
  isOffhandSlotDisabled,
  prospectInventory,
  prospectInventoryItem,
  sellAllItems,
  sellInventoryItem,
  setInventoryItemLocked,
  sortInventory,
  takeAllTileItems,
  takeTileItem,
} from './stateInventoryActions';
export {
  activateInventoryItem,
  equipItem,
  unequipItem,
  useItem,
} from './stateItemActions';
export {
  corruptInventoryItem,
  enchantInventoryItem,
  reforgeInventoryItem,
} from './stateItemModificationActions';
export {
  attackCombatEnemy,
  forfeitCombat,
  getCombatAutomationDelay,
  getEnemyCombatAttack,
  getEnemyCombatAttackSpeed,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
  progressCombat,
  startCombat,
} from './stateCombat';
export {
  syncBloodMoon,
  syncPlayerStatusEffects,
  triggerEarthshake,
} from './stateWorldClock';
export { toggleFavoriteRecipe } from './crafting';

export const HARVEST_MOON_RESOURCE_TYPE_CHANCES = HARVEST_MOON_RESOURCE_CHANCES;
