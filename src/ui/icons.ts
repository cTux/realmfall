import {
  getEnemyConfig,
  type EquipmentSlot,
  type Enemy,
  getItemConfig,
  type Item,
  type SkillName,
  getStructureConfig,
} from '../game/state';
import { EquipmentSlotId } from '../game/content/ids';
import { getItemCategory } from '../game/content/items';
import playerIcon from '../assets/icons/visored-helm.svg';
import enemyIcon from '../assets/icons/wolf-head.svg';
import weaponIcon from '../assets/icons/plain-dagger.svg';
import armorIcon from '../assets/icons/checked-shield.svg';
import artifactIcon from '../assets/icons/ankh.svg';
import consumableIcon from '../assets/icons/potion-ball.svg';
import hoodIcon from '../assets/icons/hood.svg';
import mailedFistIcon from '../assets/icons/mailed-fist.svg';
import steeltoeBootsIcon from '../assets/icons/steeltoe-boots.svg';
import crystalBallIcon from '../assets/icons/crystal-ball.svg';
import hornedHelmIcon from '../assets/icons/horned-helm.svg';
import spikedArmorIcon from '../assets/icons/spiked-armor.svg';
import villageIcon from '../assets/icons/village.svg';
import dungeonGateIcon from '../assets/icons/dungeon-gate.svg';
import anvilIcon from '../assets/icons/anvil.svg';
import animalHideIcon from '../assets/icons/animal-hide.svg';
import stonePileIcon from '../assets/icons/stone-pile.svg';
import axeInStumpIcon from '../assets/icons/axe-in-stump.svg';
import coinsIcon from '../assets/icons/coins.svg';
import herbsBundleIcon from '../assets/icons/herbs-bundle.svg';
import logIcon from '../assets/icons/log.svg';
import oreIcon from '../assets/icons/ore.svg';
import salmonIcon from '../assets/icons/salmon.svg';
import shinyAppleIcon from '../assets/icons/shiny-apple.svg';
import sparklesIcon from '../assets/icons/sparkles.svg';
import stoneBlockIcon from '../assets/icons/stone-block.svg';
import spillIcon from '../assets/icons/spill.svg';
import sunCloudIcon from '../assets/icons/sun-cloud.svg';
import rainingIcon from '../assets/icons/raining.svg';
import snowingIcon from '../assets/icons/snowing.svg';
import highGrassIcon from '../assets/icons/high-grass.svg';
import totemIcon from '../assets/icons/totem.svg';
import woodStickIcon from '../assets/icons/wood-stick.svg';
import bookCoverIcon from '../assets/icons/book-cover.svg';
import friedFishIcon from '../assets/icons/fried-fish.svg';
import campCookingPotIcon from '../assets/icons/camp-cooking-pot.svg';
import stoneCraftingIcon from '../assets/icons/stone-crafting.svg';
import spiderAltIcon from '../assets/icons/spider-alt.svg';
import tiedScrollIcon from '../assets/icons/tied-scroll.svg';
import arrowDunkIcon from '../assets/icons/arrow-dunk.svg';
import rolledClothIcon from '../assets/icons/rolled-cloth.svg';
import type { StructureType } from '../game/state';
import { GAME_TAGS } from '../game/content/tags';
import { rarityColor } from './rarity';

export const Icons = {
  Player: playerIcon,
  Enemy: enemyIcon,
  Weapon: weaponIcon,
  Armor: armorIcon,
  Artifact: artifactIcon,
  Consumable: consumableIcon,
  Hood: hoodIcon,
  Gauntlet: mailedFistIcon,
  Boots: steeltoeBootsIcon,
  Orb: crystalBallIcon,
  HornedHelm: hornedHelmIcon,
  Chest: spikedArmorIcon,
  Village: villageIcon,
  DungeonGate: dungeonGateIcon,
  Anvil: anvilIcon,
  AnimalHide: animalHideIcon,
  StonePile: stonePileIcon,
  AxeInStump: axeInStumpIcon,
  Coins: coinsIcon,
  HerbsBundle: herbsBundleIcon,
  Log: logIcon,
  Ore: oreIcon,
  Salmon: salmonIcon,
  ShinyApple: shinyAppleIcon,
  Sparkles: sparklesIcon,
  StoneBlock: stoneBlockIcon,
  Spill: spillIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  HighGrass: highGrassIcon,
  Totem: totemIcon,
  WoodStick: woodStickIcon,
  BookCover: bookCoverIcon,
  FriedFish: friedFishIcon,
  CampCookingPot: campCookingPotIcon,
  StoneCrafting: stoneCraftingIcon,
  Spider: spiderAltIcon,
  TiedScroll: tiedScrollIcon,
  ArrowDunk: arrowDunkIcon,
  RolledCloth: rolledClothIcon,
} as const;

export const SkillIcon: Record<SkillName, string> = {
  logging: Icons.AxeInStump,
  mining: Icons.Ore,
  skinning: Icons.AnimalHide,
  fishing: Icons.Salmon,
  cooking: Icons.CampCookingPot,
  crafting: Icons.StoneCrafting,
};

const DEFAULT_ENEMY_ICON = Icons.Enemy;
const DEFAULT_ENEMY_TINT = 0x60a5fa;
const DEFAULT_ITEM_ICON = Icons.Artifact;

export const ItemIcon: Record<EquipmentSlot, string> = {
  [EquipmentSlotId.Weapon]: Icons.Weapon,
  [EquipmentSlotId.Offhand]: Icons.Armor,
  [EquipmentSlotId.Head]: Icons.Hood,
  [EquipmentSlotId.Chest]: Icons.Chest,
  [EquipmentSlotId.Hands]: Icons.Gauntlet,
  [EquipmentSlotId.Legs]: Icons.Chest,
  [EquipmentSlotId.Feet]: Icons.Boots,
  [EquipmentSlotId.RingLeft]: Icons.Artifact,
  [EquipmentSlotId.RingRight]: Icons.Artifact,
  [EquipmentSlotId.Amulet]: Icons.Artifact,
  [EquipmentSlotId.Cloak]: Icons.Hood,
  [EquipmentSlotId.Relic]: Icons.Orb,
};

const ItemKindIcon: Record<
  Exclude<ReturnType<typeof getItemCategory>, 'resource'>,
  string
> = {
  weapon: Icons.Weapon,
  armor: DEFAULT_ITEM_ICON,
  artifact: DEFAULT_ITEM_ICON,
  consumable: Icons.Consumable,
};

export function enemyIconFor(
  enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string,
) {
  const configured = getEnemyConfig(
    typeof enemy === 'string' ? enemy : (enemy.enemyTypeId ?? enemy.name),
  );
  return configured?.icon ?? DEFAULT_ENEMY_ICON;
}

export function enemyTint(enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string) {
  const configured = getEnemyConfig(
    typeof enemy === 'string' ? enemy : (enemy.enemyTypeId ?? enemy.name),
  );
  return configured?.tint ?? DEFAULT_ENEMY_TINT;
}

export function iconForItem(item?: Item, slot?: EquipmentSlot) {
  const slotIcon = slot ? ItemIcon[slot] : undefined;
  const itemSlotIcon = item?.slot ? ItemIcon[item.slot] : undefined;
  const configuredItem = item ? getItemConfig(item) : undefined;
  const configuredItemIcon =
    item &&
    ((item.tags ?? []).includes(GAME_TAGS.item.totem) ||
      item.name.endsWith(' Totem'))
      ? Icons.Totem
      : configuredItem?.icon;
  const category = item ? getItemCategory(item) : undefined;
  const kindIcon =
    category && category !== 'resource' ? ItemKindIcon[category] : undefined;

  return (
    configuredItemIcon ??
    itemSlotIcon ??
    kindIcon ??
    slotIcon ??
    DEFAULT_ITEM_ICON
  );
}

export function structureIconFor(structure: StructureType) {
  return getStructureConfig(structure).icon;
}

export function structureTint(structure: StructureType) {
  return getStructureConfig(structure).tint;
}

export function itemTint(item?: Item) {
  if (!item) return rarityColor('common');
  return getItemConfig(item)?.tint ?? rarityColor(item.rarity);
}
