import type {
  EquipmentSlot,
  Item,
  ItemKind,
  ItemRarity,
  SkillName,
  StructureType,
  Terrain,
} from '../types';
import type { EnemyTypeKey, ItemKey } from './ids';
import type { GameTag } from './tags';

export interface ItemConfig {
  key: ItemKey;
  name: string;
  kind: ItemKind;
  slot?: EquipmentSlot;
  icon: string;
  tint?: string;
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
  reward: string;
  rewardTier: number;
  baseYield: number;
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
  name?: string;
  tags?: Item['tags'];
}
