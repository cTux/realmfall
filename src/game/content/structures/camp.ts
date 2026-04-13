import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const campStructureConfig: StructureConfig = {
  type: 'camp',
  title: 'Campfire',
  description: 'A campfire used to cook provisions into better meals.',
  icon: ContentIcons.CampCookingPot,
  tint: 0xef4444,
  functionsProvided: ['cook'],
  globalAppearanceThreshold: 0.96,
};
