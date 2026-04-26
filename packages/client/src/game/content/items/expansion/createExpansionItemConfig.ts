import { itemName } from '../../i18n';
import { GAME_TAGS } from '../../tags';
import type { ItemConfig } from '../../types';

interface ExpansionItemConfigInput {
  key: string;
  slot?: ItemConfig['slot'];
  icon: string;
  category?: ItemConfig['category'];
  tier: number;
  rarity: ItemConfig['rarity'];
  power: number;
  defense: number;
  maxHp: number;
  healing?: number;
  hunger?: number;
  thirst?: number;
}

export function createExpansionItemConfig({
  key,
  slot,
  icon,
  category,
  tier,
  rarity,
  power,
  defense,
  maxHp,
  healing = 0,
  hunger = 0,
  thirst = 0,
}: ExpansionItemConfigInput): ItemConfig {
  return {
    key,
    name: itemName(key),
    slot,
    icon,
    category,
    tier,
    rarity,
    power,
    defense,
    maxHp,
    healing,
    hunger,
    thirst,
    tags: [GAME_TAGS.item.crafted],
  };
}
