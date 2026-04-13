import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const townStructureConfig: StructureConfig = {
  type: 'town',
  title: 'Town',
  description: 'A safe haven for trade, supplies, and a brief respite.',
  icon: ContentIcons.Village,
  tint: 0xfbbf24,
  functionsProvided: ['trade', 'buy', 'sell'],
  globalAppearanceThreshold: 0.976,
};
