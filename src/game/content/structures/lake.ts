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

export const lakeStructureConfig: StructureConfig = {
  type: 'lake',
  title: structureTitle('lake'),
  description: structureDescription('lake'),
  icon: ContentIcons.Spill,
  tint: 0x2563eb,
  functionsProvided: ['fish'],
  appearanceChanceByTerrain: {
    plains: 0.79,
  },
  gathering: {
    actionLabel: structureActionLabel('lake'),
    maxHp: 6,
    skill: Skill.Fishing,
    rewardItemKey: ItemId.RawFish,
    reward: itemName(ItemId.RawFish),
    rewardTier: 2,
    baseYield: 2,
    verb: structureGatherVerb('lake'),
    depletedText: structureDepletedText('lake'),
  },
};
