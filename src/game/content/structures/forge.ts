import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const forgeStructureConfig: StructureConfig = {
  type: 'forge',
  title: structureTitle('forge'),
  description: structureDescription('forge'),
  icon: ContentIcons.Anvil,
  tint: 0xf97316,
  functionsProvided: ['prospect'],
  globalAppearanceThreshold: 0.984,
};
