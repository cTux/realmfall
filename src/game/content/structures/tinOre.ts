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

export const tinOreStructureConfig: StructureConfig = {
  type: 'tin-ore',
  title: structureTitle('tin-ore'),
  description: structureDescription('tin-ore'),
  icon: ContentIcons.Ore,
  tint: 0xcbd5e1,
  functionsProvided: ['mine-tin'],
  appearanceChanceByTerrain: {
    plains: 0.86,
    forest: 0.845,
    highlands: 0.9,
    tundra: 0.94,
  },
  gathering: {
    actionLabel: structureActionLabel('tin-ore'),
    maxHp: 7,
    skill: Skill.Mining,
    rewardItemKey: ItemId.TinOre,
    reward: itemName(ItemId.TinOre),
    rewardTier: 2,
    baseYield: 1,
    verb: structureGatherVerb('tin-ore'),
    depletedText: structureDepletedText('tin-ore'),
  },
};
