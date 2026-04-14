import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { StructureConfig } from '../types';
import { Skill } from '../../types';

export const copperOreStructureConfig: StructureConfig = {
  type: 'copper-ore',
  title: 'Copper Vein',
  description: 'A mining vein that yields copper ore when harvested.',
  icon: ContentIcons.Ore,
  tint: 0xf59e0b,
  functionsProvided: ['mine-copper'],
  appearanceChanceByTerrain: {
    plains: 0.84,
    desert: 0.84,
  },
  gathering: {
    actionLabel: 'Mine Copper Vein',
    maxHp: 6,
    skill: Skill.Mining,
    rewardItemKey: ItemId.CopperOre,
    reward: 'Copper Ore',
    rewardTier: 1,
    baseYield: 1,
    verb: 'You mine the copper vein',
    depletedText: 'The copper vein is spent.',
  },
};
