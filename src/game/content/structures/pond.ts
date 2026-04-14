import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { StructureConfig } from '../types';

export const pondStructureConfig: StructureConfig = {
  type: 'pond',
  title: 'Pond',
  description: 'A fishing spot that yields raw fish when worked.',
  icon: ContentIcons.Spill,
  tint: 0x38bdf8,
  functionsProvided: ['fish'],
  appearanceChanceByTerrain: {
    swamp: 0.81,
  },
  gathering: {
    actionLabel: 'Fish pond',
    maxHp: 4,
    skill: 'fishing',
    rewardItemKey: ItemId.RawFish,
    reward: 'Raw Fish',
    rewardTier: 1,
    baseYield: 1,
    verb: 'You fish the pond',
    depletedText: 'The pond goes quiet for now.',
  },
};
