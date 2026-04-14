import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { StructureConfig } from '../types';
import { Skill } from '../../types';

export const ironOreStructureConfig: StructureConfig = {
  type: 'iron-ore',
  title: 'Iron Vein',
  description: 'A mining vein that yields iron ore when harvested.',
  icon: ContentIcons.Ore,
  tint: 0x94a3b8,
  functionsProvided: ['mine-iron'],
  appearanceChanceByTerrain: {
    swamp: 0.82,
    forest: 0.82,
  },
  gathering: {
    actionLabel: 'Mine Iron Vein',
    maxHp: 8,
    skill: Skill.Mining,
    rewardItemKey: ItemId.IronOre,
    reward: 'Iron Ore',
    rewardTier: 2,
    baseYield: 1,
    verb: 'You mine the iron vein',
    depletedText: 'The iron vein is spent.',
  },
};
