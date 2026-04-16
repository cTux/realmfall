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
    skill: Skill.Gathering,
    rewardItemKey: ItemId.Herbs,
    reward: itemName(ItemId.Herbs),
    rewardTier: 1,
    baseYield: 2,
    rewardTable: [
      { itemKey: 'herbs', weight: 3 },
      { itemKey: 'beet', weight: 1 },
      { itemKey: 'pepper', weight: 1 },
      { itemKey: 'cabbage', weight: 1 },
      { itemKey: 'carrot', weight: 1 },
      { itemKey: 'cherry', weight: 1 },
      { itemKey: 'garlic', weight: 1 },
      { itemKey: 'leek', weight: 1 },
      { itemKey: 'lemon', weight: 1 },
      { itemKey: 'peas', weight: 1 },
      { itemKey: 'tomato', weight: 1 },
      { itemKey: 'aubergine', weight: 1 },
      { itemKey: 'apple', weight: 1, rewardTier: 2 },
    ],
    verb: structureGatherVerb('herbs'),
    depletedText: structureDepletedText('herbs'),
  },
};
