import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const herbsStructureConfig: StructureConfig = {
  type: 'herbs',
  title: 'Herb Patch',
  description: 'A fragrant patch that yields herbs when gathered.',
  icon: ContentIcons.HerbsBundle,
  tint: 0x22d3ee,
  functionsProvided: ['gather-herbs'],
  gathering: {
    actionLabel: 'Gather herbs',
    maxHp: 3,
    skill: 'crafting',
    reward: 'Herbs',
    rewardTier: 1,
    baseYield: 2,
    verb: 'You gather the herb patch',
    depletedText: 'The herb patch is picked clean.',
  },
};
