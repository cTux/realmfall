import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';
import { buildUtilityStructureTags } from './structureTagRules';

export const watchtowerStructureConfig: StructureConfig = {
  type: 'watchtower',
  title: structureTitle('watchtower'),
  description: structureDescription('watchtower'),
  icon: ContentIcons.Village,
  tint: 0xfbbf24,
  functionsProvided: [],
  tags: buildUtilityStructureTags(),
};
