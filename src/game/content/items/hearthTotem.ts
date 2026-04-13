import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const hearthTotemItemConfig: ItemConfig = {
  key: 'hearth-totem',
  name: 'Hearth Totem',
  kind: 'artifact',
  slot: 'relic',
  icon: ContentIcons.Totem,
  tier: 1,
  rarity: 'common',
  power: 1,
  defense: 0,
  maxHp: 3,
  healing: 0,
  hunger: 0,
};
