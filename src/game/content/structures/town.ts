import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildSettlementStructureTags } from './structureTagRules';

export const townStructureConfig: StructureConfig = {
  type: 'town',
  title: structureTitle('town'),
  description: structureDescription('town'),
  icon: ContentIcons.Village,
  tint: 0xfbbf24,
  functionsProvided: ['trade', 'buy', 'sell'],
  tags: buildSettlementStructureTags(GAME_TAGS.structure.town),
  globalAppearanceThreshold: 0.976,
};
