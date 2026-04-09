import type { WindowPosition } from '../../../app/constants';

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
}

export interface HeroWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  stats: HeroWindowStats;
  hunger: number;
}
