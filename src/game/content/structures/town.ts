import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const townStructureConfig: StructureConfig = {
  type: 'town',
  title: 'Town',
  description:
    'A shardside refuge where survivors trade, resupply, and catch their breath.',
  icon: ContentIcons.Village,
  tint: 0xfbbf24,
  functionsProvided: ['trade', 'buy', 'sell'],
  globalAppearanceThreshold: 0.976,
};
