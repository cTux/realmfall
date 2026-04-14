import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { StructureConfig } from '../types';
import { Skill } from '../../types';

export const coalOreStructureConfig: StructureConfig = {
  type: 'coal-ore',
  title: 'Coal Seam',
  description: 'A mining seam that yields coal when harvested.',
  icon: ContentIcons.Ore,
  tint: 0x475569,
  functionsProvided: ['mine-coal'],
  appearanceChanceByTerrain: {
    desert: 0.81,
  },
  gathering: {
    actionLabel: 'Mine Coal Seam',
    maxHp: 7,
    skill: Skill.Mining,
    rewardItemKey: ItemId.Coal,
    reward: 'Coal',
    rewardTier: 2,
    baseYield: 1,
    verb: 'You mine the coal seam',
    depletedText: 'The coal seam is spent.',
  },
};
