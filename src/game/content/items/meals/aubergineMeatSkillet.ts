import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const aubergineMeatSkilletItemConfig: ItemConfig = {
  key: 'aubergine-meat-skillet',
  name: itemName('aubergine-meat-skillet'),
  icon: ContentIcons.Aubergine,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 18,
  hunger: 58,
  thirst: 8,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
