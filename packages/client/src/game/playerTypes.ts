import type { GameTag } from './content/tags';
import type { StatusEffectIdValue } from './content/ids';
import type { SkillName } from './abilityTypes';
import type { HexCoord } from './hex';
import type { Equipment } from './itemTypes';
import type { Item } from './itemTypes';

export type StatusEffectId = StatusEffectIdValue;

export interface PlayerStatusEffect {
  id: StatusEffectId;
  tags?: GameTag[];
  expiresAt?: number;
  tickIntervalMs?: number;
  lastProcessedAt?: number;
  stacks?: number;
  value?: number;
}

export interface SkillProgress {
  level: number;
  xp: number;
}

export interface Player {
  coord: HexCoord;
  level: number;
  masteryLevel: number;
  xp: number;
  hp: number;
  baseMaxHp: number;
  mana: number;
  baseMaxMana: number;
  hunger: number;
  thirst?: number;
  baseAttack: number;
  baseDefense: number;
  skills: Record<SkillName, SkillProgress>;
  learnedRecipeIds: string[];
  favoriteRecipeIds: string[];
  inventory: Item[];
  equipment: Equipment;
  statusEffects: PlayerStatusEffect[];
  consumableCooldownEndsAt?: number;
}
