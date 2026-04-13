import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const ironOreStructureConfig: StructureConfig = {
  type: 'iron-ore',
  title: 'Iron Vein',
  description: 'A mining vein that yields iron ore when harvested.',
  icon: ContentIcons.Ore,
  tint: 0x94a3b8,
  functionsProvided: ['mine-iron'],
  appearanceChanceByTerrain: {
    swamp: 0.3,
    forest: 0.3,
  },
  gathering: {
    actionLabel: 'Mine Iron Vein',
    maxHp: 8,
    skill: 'mining',
    reward: 'Iron Ore',
    rewardTier: 2,
    baseYield: 1,
    verb: 'You mine the iron vein',
    depletedText: 'The iron vein is spent.',
  },
};
