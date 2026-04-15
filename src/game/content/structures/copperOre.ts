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

export const copperOreStructureConfig: StructureConfig = {
  type: 'copper-ore',
  title: structureTitle('copper-ore'),
  description: structureDescription('copper-ore'),
  icon: ContentIcons.Ore,
  tint: 0xf59e0b,
  functionsProvided: ['mine-copper'],
  appearanceChanceByTerrain: {
    plains: 0.84,
    desert: 0.84,
  },
  gathering: {
    actionLabel: structureActionLabel('copper-ore'),
    maxHp: 6,
    skill: Skill.Mining,
    rewardItemKey: ItemId.CopperOre,
    reward: itemName(ItemId.CopperOre),
    rewardTier: 1,
    baseYield: 1,
    verb: structureGatherVerb('copper-ore'),
    depletedText: structureDepletedText('copper-ore'),
  },
};
