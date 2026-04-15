import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const townStructureConfig: StructureConfig = {
  type: 'town',
  title: structureTitle('town'),
  description: structureDescription('town'),
  icon: ContentIcons.Village,
  tint: 0xfbbf24,
  functionsProvided: ['trade', 'buy', 'sell'],
  globalAppearanceThreshold: 0.976,
};
