import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { StructureConfig } from '../types';

export const lakeStructureConfig: StructureConfig = {
  type: 'lake',
  title: 'Lake',
  description: 'A broad fishing spot that yields raw fish when worked.',
  icon: ContentIcons.Spill,
  tint: 0x2563eb,
  functionsProvided: ['fish'],
  appearanceChanceByTerrain: {
    plains: 0.79,
  },
  gathering: {
    actionLabel: 'Fish lake',
    maxHp: 6,
    skill: 'fishing',
    rewardItemKey: ItemId.RawFish,
    reward: 'Raw Fish',
    rewardTier: 2,
    baseYield: 2,
    verb: 'You fish the lake',
    depletedText: 'The lake settles after your catch.',
  },
};
