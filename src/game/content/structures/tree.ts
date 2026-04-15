import {
  itemName,
  structureActionLabel,
  structureDepletedText,
  structureDescription,
  structureGatherVerb,
  structureTitle,
} from '../i18n';
import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { StructureConfig } from '../types';
import { Skill } from '../../types';

export const treeStructureConfig: StructureConfig = {
  type: 'tree',
  title: structureTitle('tree'),
  description: structureDescription('tree'),
  icon: ContentIcons.AxeInStump,
  tint: 0x22c55e,
  functionsProvided: ['chop-wood'],
  appearanceChanceByTerrain: {
    forest: 0.86,
  },
  gathering: {
    actionLabel: structureActionLabel('tree'),
    maxHp: 5,
    skill: Skill.Logging,
    rewardItemKey: ItemId.Logs,
    reward: itemName(ItemId.Logs),
    rewardTier: 1,
    baseYield: 2,
    verb: structureGatherVerb('tree'),
    depletedText: structureDepletedText('tree'),
  },
};
