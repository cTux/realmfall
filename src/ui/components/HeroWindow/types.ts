import type { WindowPosition } from '../../../app/constants';
import type { AbilityId, SkillName } from '../../../game/state';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface HeroWindowStats {
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
  buffs: string[];
  debuffs: string[];
  abilityIds: AbilityId[];
  level: number;
  masteryLevel: number;
  skills: Record<SkillName, { level: number; xp: number }>;
}

export interface HeroWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  stats: HeroWindowStats;
  hunger: number;
  thirst?: number;
  worldTimeMs?: number;
}
