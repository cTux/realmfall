import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const campStructureConfig: StructureConfig = {
  type: 'camp',
  title: 'Campfire',
  description:
    'A banked campfire where raw provisions can be made safe to eat.',
  icon: ContentIcons.CampCookingPot,
  tint: 0xef4444,
  functionsProvided: ['cook'],
  globalAppearanceThreshold: 0.96,
};
