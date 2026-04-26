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
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { Skill } from '../../types';
import { buildGatheringStructureTags } from './structureTagRules';

export const flaxStructureConfig: StructureConfig = {
  type: 'flax',
  title: structureTitle('flax'),
  description: structureDescription('flax'),
  icon: ContentIcons.Flax,
  tint: 0x84cc16,
  functionsProvided: ['harvest-flax'],
  tags: buildGatheringStructureTags(Skill.Gathering, GAME_TAGS.structure.herbs),
  appearanceChanceByTerrain: {
    meadow: 0.84,
    plains: 0.83,
    grove: 0.825,
  },
  gathering: {
    actionLabel: structureActionLabel('flax'),
    maxHp: 4,
    skill: Skill.Gathering,
    rewardItemKey: ItemId.Flax,
    reward: itemName(ItemId.Flax),
    rewardTier: 1,
    baseYield: 2,
    verb: structureGatherVerb('flax'),
    depletedText: structureDepletedText('flax'),
  },
};
