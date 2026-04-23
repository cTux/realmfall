import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const furnaceStructureConfig: StructureConfig = {
  type: 'furnace',
  title: structureTitle('furnace'),
  description: structureDescription('furnace'),
  icon: ContentIcons.Furnace,
  tint: 0xffffff,
  functionsProvided: ['smelt'],
  globalAppearanceThreshold: 0.968,
};
