import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const treeStructureConfig: StructureConfig = {
  type: 'tree',
  title: 'Tree',
  description: 'A logging node that yields logs when harvested.',
  icon: ContentIcons.AxeInStump,
  tint: 0x22c55e,
  functionsProvided: ['chop-wood'],
  appearanceChanceByTerrain: {
    forest: 0.45,
  },
  gathering: {
    actionLabel: 'Chop tree',
    maxHp: 5,
    skill: 'logging',
    reward: 'Logs',
    rewardTier: 1,
    baseYield: 2,
    verb: 'You chop the tree',
    depletedText: 'The tree falls, leaving only a stump behind.',
  },
};
