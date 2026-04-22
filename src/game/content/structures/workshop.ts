import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const workshopStructureConfig: StructureConfig = {
  type: 'workshop',
  title: structureTitle('workshop'),
  description: structureDescription('workshop'),
  icon: ContentIcons.StoneCrafting,
  tint: 0x22c55e,
  functionsProvided: ['craft'],
  globalAppearanceThreshold: 0.964,
};
