import type { EquipmentSlot, Item, ItemRarity } from './game/stateTypes';
import {
  getItemCategory,
  isEquippableItemCategory,
} from './game/content/items';
import { EquipmentSlotId } from './game/content/ids';
import { GAME_TAGS } from './game/content/tags';
import { resolveIconAsset } from './iconAssets';
import {
  DEFAULT_ITEM_BORDER_TINT,
  getItemKindIcon,
  getItemTintFallback,
  ItemCategoryIconKey,
  RECIPE_PAGE_TINT,
} from './itemMetadata';
import weaponIcon from '../../client/src/assets/icons/plain-dagger.svg';
import armorIcon from '../../client/src/assets/icons/checked-shield.svg';
import artifactIcon from '../../client/src/assets/icons/ankh.svg';
import consumableIcon from '../../client/src/assets/icons/potion-ball.svg';
import hoodIcon from '../../client/src/assets/icons/hood.svg';
import gauntletIcon from '../../client/src/assets/icons/mailed-fist.svg';
import bootsIcon from '../../client/src/assets/icons/steeltoe-boots.svg';
import orbIcon from '../../client/src/assets/icons/crystal-ball.svg';
import chestIcon from '../../client/src/assets/icons/spiked-armor.svg';
import scrollQuillIcon from '../../client/src/assets/game-icons/delapouite/scroll-quill.svg';
import totemIcon from '../../client/src/assets/icons/totem.svg';

const TOTEM_ITEM_TAG = GAME_TAGS.item.totem;

const Icons = {
  Weapon: weaponIcon,
  Armor: armorIcon,
  Artifact: artifactIcon,
  Consumable: consumableIcon,
  Hood: hoodIcon,
  Gauntlet: gauntletIcon,
  Boots: bootsIcon,
  Orb: orbIcon,
  Totem: totemIcon,
  Chest: chestIcon,
  ScrollQuill: scrollQuillIcon,
} as const;

const ItemSlotIcon: Record<EquipmentSlot, string> = {
  [EquipmentSlotId.Weapon]: Icons.Weapon,
  [EquipmentSlotId.Offhand]: Icons.Armor,
  [EquipmentSlotId.Head]: Icons.Hood,
  [EquipmentSlotId.Shoulders]: Icons.Armor,
  [EquipmentSlotId.Chest]: Icons.Chest,
  [EquipmentSlotId.Bracers]: Icons.Gauntlet,
  [EquipmentSlotId.Hands]: Icons.Gauntlet,
  [EquipmentSlotId.Belt]: Icons.Armor,
  [EquipmentSlotId.Legs]: Icons.Chest,
  [EquipmentSlotId.Feet]: Icons.Boots,
  [EquipmentSlotId.RingLeft]: Icons.Artifact,
  [EquipmentSlotId.RingRight]: Icons.Artifact,
  [EquipmentSlotId.Amulet]: Icons.Artifact,
  [EquipmentSlotId.Cloak]: Icons.Hood,
  [EquipmentSlotId.Relic]: Icons.Orb,
};

const ItemKindIcon: Record<ItemCategoryIconKey, string> = {
  weapon: Icons.Weapon,
  armor: Icons.Armor,
  artifact: Icons.Artifact,
  consumable: Icons.Consumable,
};

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: '#f8fafc',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fb923c',
};

function isRecipePage(item: Item) {
  return (
    item.recipeId != null || (item.tags ?? []).includes(GAME_TAGS.item.recipe)
  );
}

export function iconForItem(item?: Item, slot?: EquipmentSlot) {
  if (item && isRecipePage(item)) {
    return resolveIconAsset(Icons.ScrollQuill);
  }

  const slotIcon = slot ? ItemSlotIcon[slot] : undefined;
  const equippedSlotIcon = item?.slot ? ItemSlotIcon[item.slot] : undefined;
  const totem =
    item && (item.tags ?? []).includes(TOTEM_ITEM_TAG)
      ? Icons.Totem
      : undefined;
  const configuredIcon = item?.icon;
  const category = item ? getItemCategory(item) : undefined;
  const categoryIcon =
    category && category !== 'resource'
      ? ItemKindIcon[getItemKindIcon(category)]
      : undefined;

  return resolveIconAsset(
    configuredIcon ??
      totem ??
      equippedSlotIcon ??
      categoryIcon ??
      slotIcon ??
      Icons.Artifact,
  );
}

export function itemBorderColor(item?: Item) {
  if (!item) return RARITY_COLOR.common;
  return isEquippableItemCategory(getItemCategory(item))
    ? RARITY_COLOR[item.rarity]
    : DEFAULT_ITEM_BORDER_TINT;
}

export function itemTint(item?: Item) {
  if (!item) return RARITY_COLOR.common;
  if (isRecipePage(item)) return RECIPE_PAGE_TINT;

  return getItemTintFallback(item) ?? DEFAULT_ITEM_BORDER_TINT;
}
