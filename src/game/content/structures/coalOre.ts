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

export const coalOreStructureConfig: StructureConfig = {
  type: 'coal-ore',
  title: structureTitle('coal-ore'),
  description: structureDescription('coal-ore'),
  icon: ContentIcons.Ore,
  tint: 0x475569,
  functionsProvided: ['mine-coal'],
  appearanceChanceByTerrain: {
    desert: 0.81,
    badlands: 0.76,
    highlands: 0.76,
    tundra: 0.85,
  },
  gathering: {
    actionLabel: structureActionLabel('coal-ore'),
    maxHp: 7,
    skill: Skill.Mining,
    rewardItemKey: ItemId.Coal,
    reward: itemName(ItemId.Coal),
    rewardTier: 2,
    baseYield: 1,
    verb: structureGatherVerb('coal-ore'),
    depletedText: structureDepletedText('coal-ore'),
  },
};
