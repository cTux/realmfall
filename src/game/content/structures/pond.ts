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

export const pondStructureConfig: StructureConfig = {
  type: 'pond',
  title: structureTitle('pond'),
  description: structureDescription('pond'),
  icon: ContentIcons.Spill,
  tint: 0x38bdf8,
  functionsProvided: ['fish'],
  appearanceChanceByTerrain: {
    swamp: 0.81,
    tundra: 0.82,
  },
  gathering: {
    actionLabel: structureActionLabel('pond'),
    maxHp: 4,
    skill: Skill.Fishing,
    rewardItemKey: ItemId.RawFish,
    reward: itemName(ItemId.RawFish),
    rewardTier: 1,
    baseYield: 1,
    verb: structureGatherVerb('pond'),
    depletedText: structureDepletedText('pond'),
  },
};
