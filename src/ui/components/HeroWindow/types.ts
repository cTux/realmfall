import type { WindowPosition } from '../../../app/constants';
import type { SkillName } from '../../../game/state';

export interface HeroWindowStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  nextLevelXp: number;
  hungerPenalty: number;
  attack: number;
  defense: number;
  level: number;
  masteryLevel: number;
  skills: Record<SkillName, { level: number; xp: number }>;
}

export interface HeroWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  stats: HeroWindowStats;
  hunger: number;
}
