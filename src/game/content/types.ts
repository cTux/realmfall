import type {
  EquipmentSlot,
  Item,
  ItemRarity,
  SkillName,
  StructureType,
  Terrain,
} from '../types';
import type { EnemyTypeKey, ItemKey } from './ids';
import type { GameTag } from './tags';

export type ItemDefinitionCategory =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'consumable'
  | 'resource';

export interface GeneratedItemStatProfile {
  basePower?: number;
  powerPerTier?: number;
  baseDefense?: number;
  defensePerTier?: number;
  baseMaxHp?: number;
  maxHpPerTier?: number;
}

export interface ItemConfig {
  key: ItemKey;
  name: string;
  slot?: EquipmentSlot;
  icon: string;
  iconPool?: readonly string[];
  tint?: string;
  category?: ItemDefinitionCategory;
  tier: number;
  rarity: ItemRarity;
  power: number;
  defense: number;
  maxHp: number;
  healing: number;
  hunger: number;
  thirst?: number;
  defaultQuantity?: number;
  dropChance?: number;
  occupiesOffhand?: boolean;
  generatedStats?: GeneratedItemStatProfile;
  tags?: GameTag[];
}

export interface EnemyConfig {
  id: EnemyTypeKey;
  name: string;
  icon: string;
  tint: number;
  appearanceChanceByTerrain: Partial<Record<Terrain, number>>;
  eliteAppearanceChance?: number;
  animal?: boolean;
  worldBoss?: boolean;
  tags?: GameTag[];
}

export interface GatheringConfig {
  actionLabel: string;
  maxHp: number;
  skill: SkillName;
  rewardItemKey: ItemKey;
  reward: string;
  rewardTier: number;
  baseYield: number;
  rewardTable?: Array<{
    itemKey: ItemKey;
    weight: number;
    rewardTier?: number;
    quantity?: number;
  }>;
  verb: string;
  depletedText: string;
}

export interface StructureConfig {
  type: StructureType;
  title: string;
  description: string;
  icon: string;
  tint: number;
  functionsProvided: string[];
  tags?: GameTag[];
  globalAppearanceThreshold?: number;
  appearanceChanceByTerrain?: Partial<Record<Terrain, number>>;
  gathering?: GatheringConfig;
}

export interface ItemBuildOverrides {
  id?: string;
  quantity?: number;
  tier?: number;
  rarity?: ItemRarity;
  power?: number;
  defense?: number;
  maxHp?: number;
  healing?: number;
  hunger?: number;
  thirst?: number;
  recipeId?: Item['recipeId'];
  locked?: Item['locked'];
  name?: string;
  icon?: Item['icon'];
  tags?: Item['tags'];
}
