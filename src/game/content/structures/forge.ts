import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const forgeStructureConfig: StructureConfig = {
  type: 'forge',
  title: 'Forge',
  description:
    'A salvage forge where broken gear is stripped down into tradeable worth.',
  icon: ContentIcons.Anvil,
  tint: 0xf97316,
  functionsProvided: ['prospect'],
  globalAppearanceThreshold: 0.984,
};
