import {
  getEnemyConfig,
  getItemConfig,
  getStructureConfig,
} from '@realmfall/core/game/stateSelectors';
import type {
  Enemy,
  EquipmentSlot,
  Item,
  SkillName,
  StructureType,
} from '@realmfall/core/game/stateTypes';
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
const coinsIcon = `${import.meta.env.BASE_URL}assets/icons/coins.svg`;
import herbsBundleIcon from '../assets/icons/herbs-bundle.svg';
import scytheIcon from '../assets/icons/scythe.svg';
import logIcon from '../assets/icons/log.svg';
import oreIcon from '../assets/icons/ore.svg';
import goldBarIcon from '../assets/icons/gold-bar.svg';
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
import scrollQuillIcon from '../assets/game-icons/delapouite/scroll-quill.svg';
import keyIcon from '../assets/game-icons/lorc/key.svg';
import arrowDunkIcon from '../assets/icons/arrow-dunk.svg';
import rolledClothIcon from '../assets/icons/rolled-cloth.svg';
import gearsIcon from '../assets/icons/gears.svg';
import padlockIcon from '../assets/icons/padlock.svg';
import furnaceIcon from '../assets/icons/furnace.svg';
import minerIcon from '../assets/icons/miner.svg';
import {
  iconForItem as sharedIconForItem,
  itemBorderColor as sharedItemBorderColor,
  itemTint as sharedItemTint,
} from '@realmfall/ui-react/itemIcons';
import { resolveGameplayIconAsset } from './gameplayIconAssets';
import { WORLD_RENDER_COLORS } from '../theme.config';

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
  Scythe: scytheIcon,
  Log: logIcon,
  Ore: oreIcon,
  GoldBar: goldBarIcon,
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
  ScrollQuill: scrollQuillIcon,
  ArrowDunk: arrowDunkIcon,
  RolledCloth: rolledClothIcon,
  Gears: gearsIcon,
  Padlock: padlockIcon,
  Furnace: furnaceIcon,
  Miner: minerIcon,
  Key: keyIcon,
} as const;

export const SkillIcon: Record<SkillName, string> = {
  gathering: Icons.Scythe,
  logging: Icons.AxeInStump,
  mining: Icons.Miner,
  skinning: Icons.AnimalHide,
  fishing: Icons.Salmon,
  hand: Icons.RolledCloth,
  cooking: Icons.CampCookingPot,
  smelting: Icons.GoldBar,
  crafting: Icons.StoneCrafting,
  lockpicking: Icons.Key,
};

const DEFAULT_ENEMY_ICON = Icons.Enemy;
const DEFAULT_ENEMY_TINT = WORLD_RENDER_COLORS.defaultEnemyIcon;

function enrichItemWithConfiguredAppearance(item?: Item) {
  if (!item || !item.itemKey) {
    return item;
  }

  const configuredItem = getItemConfig(item);
  if (!configuredItem) {
    return item;
  }

  const configuredIcon = configuredItem.icon
    ? (resolveGameplayIconAsset(configuredItem.icon) ?? configuredItem.icon)
    : undefined;
  const itemIcon = item.icon
    ? (resolveGameplayIconAsset(item.icon) ?? item.icon)
    : undefined;

  return {
    ...item,
    icon: itemIcon ?? configuredIcon,
    tint: item.tint ?? configuredItem.tint,
  };
}

export function enemyIconFor(
  enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string,
) {
  const enemyTypeId = typeof enemy === 'string' ? enemy : enemy.enemyTypeId;
  const configured = enemyTypeId ? getEnemyConfig(enemyTypeId) : undefined;
  return configured?.icon ?? DEFAULT_ENEMY_ICON;
}

export function enemyTint(enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string) {
  const enemyTypeId = typeof enemy === 'string' ? enemy : enemy.enemyTypeId;
  const configured = enemyTypeId ? getEnemyConfig(enemyTypeId) : undefined;
  return configured?.tint ?? DEFAULT_ENEMY_TINT;
}

export function iconForItem(item?: Item, slot?: EquipmentSlot) {
  return sharedIconForItem(enrichItemWithConfiguredAppearance(item), slot);
}

export function structureIconFor(structure: StructureType) {
  return getStructureConfig(structure).icon;
}

export function structureTint(structure: StructureType) {
  return getStructureConfig(structure).tint;
}

export function itemBorderColor(item?: Item) {
  return sharedItemBorderColor(enrichItemWithConfiguredAppearance(item));
}

export function itemTint(item?: Item) {
  return sharedItemTint(enrichItemWithConfiguredAppearance(item));
}
