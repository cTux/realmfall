import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const workshopStructureConfig: StructureConfig = {
  type: 'workshop',
  title: 'Workshop',
  description: 'A workbench for turning gathered materials into equipment.',
  icon: ContentIcons.StoneCrafting,
  tint: 0x22c55e,
  functionsProvided: ['craft'],
  globalAppearanceThreshold: 0.968,
};
