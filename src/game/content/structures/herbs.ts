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

export const herbsStructureConfig: StructureConfig = {
  type: 'herbs',
  title: structureTitle('herbs'),
  description: structureDescription('herbs'),
  icon: ContentIcons.HerbsBundle,
  tint: 0x22d3ee,
  functionsProvided: ['gather-herbs'],
  gathering: {
    actionLabel: structureActionLabel('herbs'),
    maxHp: 3,
    skill: Skill.Crafting,
    rewardItemKey: ItemId.Herbs,
    reward: itemName(ItemId.Herbs),
    rewardTier: 1,
    baseYield: 2,
    verb: structureGatherVerb('herbs'),
    depletedText: structureDepletedText('herbs'),
  },
};
