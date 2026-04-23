import type {
  AbilityId,
  PlayerStatusEffect,
  SkillName,
  StatusEffectId,
} from '../../../game/stateTypes';
import type { SecondaryStatKey } from '../../../game/types';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface HeroOverview {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  nextLevelXp: number;
  rawAttack: number;
  rawDefense: number;
  attack: number;
  defense: number;
  attackSpeed?: number;
  bonusExperience?: number;
  criticalStrikeChance?: number;
  criticalStrikeDamage?: number;
  lifestealChance?: number;
  lifestealAmount?: number;
  dodgeChance?: number;
  blockChance?: number;
  suppressDamageChance?: number;
  suppressDamageReduction?: number;
  suppressDebuffChance?: number;
  bleedChance?: number;
  poisonChance?: number;
  burningChance?: number;
  chillingChance?: number;
  powerBuffChance?: number;
  frenzyBuffChance?: number;
  secondaryStatTotals?: Partial<
    Record<SecondaryStatKey, { effective: number; raw: number }>
  >;
  statusEffects: Pick<
    PlayerStatusEffect,
    'id' | 'value' | 'tickIntervalMs' | 'stacks'
  >[];
  buffs: StatusEffectId[];
  debuffs: StatusEffectId[];
  abilityIds: AbilityId[];
  level: number;
  masteryLevel: number;
  skills: Record<SkillName, { level: number; xp: number }>;
}

export interface HeroWindowProps
  extends ManagedWindowShellProps, WindowDetailTooltipHandlers {
  hero: HeroOverview;
  hunger: number;
  thirst?: number;
}
