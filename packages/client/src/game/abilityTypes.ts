import type { GameTag } from './content/tags';
import type { StatusEffectIdValue } from './content/ids';

export enum Skill {
  Gathering = 'gathering',
  Logging = 'logging',
  Mining = 'mining',
  Skinning = 'skinning',
  Fishing = 'fishing',
  Hand = 'hand',
  Cooking = 'cooking',
  Smelting = 'smelting',
  Crafting = 'crafting',
  Lockpicking = 'lockpicking',
}

export type SkillName = Skill;
export const SKILL_NAMES = Object.values(Skill) as SkillName[];

export type AbilityId = string;

export type AbilityTarget =
  | 'self'
  | 'injuredAlly'
  | 'randomAlly'
  | 'allAllies'
  | 'enemy'
  | 'randomEnemy'
  | 'allEnemies';

export type AbilitySchool = 'melee' | 'fire' | 'lightning' | 'ice' | 'support';

export type AbilityEffectDefinition =
  | {
      kind: 'damage';
      powerMultiplier: number;
      flatPower?: number;
      statusEffectId?: StatusEffectIdValue;
      statusChance?: number;
      durationMs?: number;
      tickIntervalMs?: number;
      stacks?: number;
      valueMultiplier?: number;
      valueFlat?: number;
      targetOverride?: AbilityTarget;
    }
  | {
      kind: 'heal';
      powerMultiplier: number;
      flatPower?: number;
      splitDivisor?: number;
      targetOverride?: AbilityTarget;
    }
  | {
      kind: 'applyStatus';
      statusEffectId: StatusEffectIdValue;
      value: number;
      durationMs?: number;
      tickIntervalMs?: number;
      stacks?: number;
      permanent?: boolean;
      targetOverride?: AbilityTarget;
    };

export interface AbilityRuntimeDefinition {
  id: AbilityId;
  manaCost: number;
  cooldownMs: number;
  castTimeMs: number;
  target: AbilityTarget;
  school: AbilitySchool;
  category: 'attacking' | 'supportive';
  effects: AbilityEffectDefinition[];
  aiPriority?: number;
  tags?: GameTag[];
}

export interface AbilityDefinition extends AbilityRuntimeDefinition {
  name: string;
  description: string;
  icon: string;
}
