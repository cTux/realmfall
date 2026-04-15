import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const campStructureConfig: StructureConfig = {
  type: 'camp',
  title: structureTitle('camp'),
  description: structureDescription('camp'),
  icon: ContentIcons.CampCookingPot,
  tint: 0xef4444,
  functionsProvided: ['cook'],
  globalAppearanceThreshold: 0.96,
};
