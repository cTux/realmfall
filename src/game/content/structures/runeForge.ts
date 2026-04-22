import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const runeForgeStructureConfig: StructureConfig = {
  type: 'rune-forge',
  title: structureTitle('rune-forge'),
  description: structureDescription('rune-forge'),
  icon: ContentIcons.Anvil,
  tint: 0xec4899,
  functionsProvided: ['reforge'],
  globalAppearanceThreshold: 0.98,
};
