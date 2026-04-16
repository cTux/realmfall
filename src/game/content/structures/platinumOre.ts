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

export const platinumOreStructureConfig: StructureConfig = {
  type: 'platinum-ore',
  title: structureTitle('platinum-ore'),
  description: structureDescription('platinum-ore'),
  icon: ContentIcons.Ore,
  tint: 0xe2e8f0,
  functionsProvided: ['mine-platinum'],
  appearanceChanceByTerrain: {
    swamp: 0.84,
    desert: 0.845,
  },
  gathering: {
    actionLabel: structureActionLabel('platinum-ore'),
    maxHp: 9,
    skill: Skill.Mining,
    rewardItemKey: ItemId.PlatinumOre,
    reward: itemName(ItemId.PlatinumOre),
    rewardTier: 4,
    baseYield: 1,
    verb: structureGatherVerb('platinum-ore'),
    depletedText: structureDepletedText('platinum-ore'),
  },
};
