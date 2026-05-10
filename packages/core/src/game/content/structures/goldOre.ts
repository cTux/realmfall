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

export const goldOreStructureConfig: StructureConfig = {
  type: 'gold-ore',
  title: structureTitle('gold-ore'),
  description: structureDescription('gold-ore'),
  icon: ContentIcons.Ore,
  tint: 0xfbbf24,
  functionsProvided: ['mine-gold'],
  tags: buildGatheringStructureTags(Skill.Mining, GAME_TAGS.structure.ore),
  appearanceChanceByTerrain: {
    desert: 0.855,
  },
  gathering: {
    actionLabel: structureActionLabel('gold-ore'),
    maxHp: 8,
    skill: Skill.Mining,
    rewardItemKey: ItemId.GoldOre,
    reward: itemName(ItemId.GoldOre),
    rewardTier: 3,
    baseYield: 1,
    verb: structureGatherVerb('gold-ore'),
    depletedText: structureDepletedText('gold-ore'),
  },
};
