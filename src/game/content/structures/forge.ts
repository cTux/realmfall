import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const forgeStructureConfig: StructureConfig = {
  type: 'forge',
  title: 'Forge',
  description: 'A blazing forge where gear can be prospected into gold.',
  icon: ContentIcons.Anvil,
  tint: 0xf97316,
  functionsProvided: ['prospect'],
  globalAppearanceThreshold: 0.984,
};
