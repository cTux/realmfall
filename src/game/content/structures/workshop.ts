import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const workshopStructureConfig: StructureConfig = {
  type: 'workshop',
  title: 'Workshop',
  description:
    "A survivor's bench for binding scavenged materials into usable gear.",
  icon: ContentIcons.StoneCrafting,
  tint: 0x22c55e,
  functionsProvided: ['craft'],
  globalAppearanceThreshold: 0.968,
};
