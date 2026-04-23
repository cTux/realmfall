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

export const copperOreStructureConfig: StructureConfig = {
  type: 'copper-ore',
  title: structureTitle('copper-ore'),
  description: structureDescription('copper-ore'),
  icon: ContentIcons.Ore,
  tint: 0xf59e0b,
  functionsProvided: ['mine-copper'],
  tags: buildGatheringStructureTags(Skill.Mining, GAME_TAGS.structure.ore),
  appearanceChanceByTerrain: {
    plains: 0.84,
    desert: 0.84,
  },
  gathering: {
    actionLabel: structureActionLabel('copper-ore'),
    maxHp: 6,
    skill: Skill.Mining,
    rewardItemKey: ItemId.CopperOre,
    reward: itemName(ItemId.CopperOre),
    rewardTier: 1,
    baseYield: 1,
    verb: structureGatherVerb('copper-ore'),
    depletedText: structureDepletedText('copper-ore'),
  },
};
