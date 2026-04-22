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

export const ironOreStructureConfig: StructureConfig = {
  type: 'iron-ore',
  title: structureTitle('iron-ore'),
  description: structureDescription('iron-ore'),
  icon: ContentIcons.Ore,
  tint: 0x94a3b8,
  functionsProvided: ['mine-iron'],
  appearanceChanceByTerrain: {
    swamp: 0.82,
    forest: 0.82,
    highlands: 0.79,
    badlands: 0.78,
  },
  gathering: {
    actionLabel: structureActionLabel('iron-ore'),
    maxHp: 8,
    skill: Skill.Mining,
    rewardItemKey: ItemId.IronOre,
    reward: itemName(ItemId.IronOre),
    rewardTier: 2,
    baseYield: 1,
    verb: structureGatherVerb('iron-ore'),
    depletedText: structureDepletedText('iron-ore'),
  },
};
