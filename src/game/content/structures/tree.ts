import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { StructureConfig } from '../types';
import { Skill } from '../../types';

export const treeStructureConfig: StructureConfig = {
  type: 'tree',
  title: 'Tree',
  description: 'A logging node that yields logs when harvested.',
  icon: ContentIcons.AxeInStump,
  tint: 0x22c55e,
  functionsProvided: ['chop-wood'],
  appearanceChanceByTerrain: {
    forest: 0.86,
  },
  gathering: {
    actionLabel: 'Chop tree',
    maxHp: 5,
    skill: Skill.Logging,
    rewardItemKey: ItemId.Logs,
    reward: 'Logs',
    rewardTier: 1,
    baseYield: 2,
    verb: 'You chop the tree',
    depletedText: 'The tree falls, leaving only a stump behind.',
  },
};
