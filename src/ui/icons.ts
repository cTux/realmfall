import type { EquipmentSlot, Item, SkillName } from '../game/state';
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
import type { StructureType } from '../game/state';
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
} as const;

export const EnemyType = {
  Raider: 'Raider',
  Marauder: 'Marauder',
  Wolf: 'Wolf',
  Boar: 'Boar',
  Stag: 'Stag',
  Spider: 'Spider',
} as const;

export const ResourceType = {
  Gold: 'Gold',
  Herbs: 'Herbs',
  Logs: 'Logs',
  Sticks: 'Sticks',
  Stone: 'Stone',
  CopperOre: 'Copper Ore',
  IronOre: 'Iron Ore',
  IronChunks: 'Iron Chunks',
  Coal: 'Coal',
  RawFish: 'Raw Fish',
  CookedFish: 'Cooked Fish',
  Cloth: 'Cloth',
  LeatherScraps: 'Leather Scraps',
  ArcaneDust: 'Arcane Dust',
  RecipeBook: 'Recipe Book',
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
const DEFAULT_RESOURCE_ICON = Icons.Artifact;

export const EnemyIcon: Record<string, string> = {
  [EnemyType.Raider]: Icons.Hood,
  [EnemyType.Marauder]: Icons.HornedHelm,
  [EnemyType.Wolf]: Icons.Enemy,
  [EnemyType.Boar]: Icons.Enemy,
  [EnemyType.Stag]: Icons.Enemy,
  [EnemyType.Spider]: Icons.Spider,
};

export const EnemyTint: Record<string, number> = {
  [EnemyType.Raider]: 0xef4444,
  [EnemyType.Marauder]: 0xa855f7,
  [EnemyType.Wolf]: 0x60a5fa,
  [EnemyType.Boar]: 0xf59e0b,
  [EnemyType.Stag]: 0x22c55e,
  [EnemyType.Spider]: 0x8b5cf6,
};

export const ItemIcon: Record<EquipmentSlot, string> = {
  weapon: Icons.Weapon,
  offhand: Icons.Armor,
  head: Icons.Hood,
  chest: Icons.Chest,
  hands: Icons.Gauntlet,
  legs: Icons.Chest,
  feet: Icons.Boots,
  ringLeft: Icons.Artifact,
  ringRight: Icons.Artifact,
  amulet: Icons.Artifact,
  cloak: Icons.Hood,
  relic: Icons.Orb,
};

export const StructureIcon: Record<StructureType, string> = {
  town: Icons.Village,
  dungeon: Icons.DungeonGate,
  forge: Icons.Anvil,
  camp: Icons.CampCookingPot,
  workshop: Icons.StoneCrafting,
  herbs: Icons.HerbsBundle,
  tree: Icons.AxeInStump,
  'copper-ore': Icons.Ore,
  'iron-ore': Icons.Ore,
  'coal-ore': Icons.Ore,
  pond: Icons.Spill,
  lake: Icons.Spill,
};

export const StructureTint: Record<StructureType, number> = {
  town: 0xfbbf24,
  forge: 0xf97316,
  dungeon: 0xa855f7,
  camp: 0xef4444,
  workshop: 0x22c55e,
  herbs: 0x22d3ee,
  tree: 0x22c55e,
  'copper-ore': 0xf59e0b,
  'iron-ore': 0x94a3b8,
  'coal-ore': 0x475569,
  pond: 0x38bdf8,
  lake: 0x2563eb,
};

export const ResourceIcon: Record<string, string> = {
  [ResourceType.Gold]: Icons.Coins,
  [ResourceType.Herbs]: Icons.HerbsBundle,
  [ResourceType.Logs]: Icons.Log,
  [ResourceType.Sticks]: Icons.WoodStick,
  [ResourceType.Stone]: Icons.StoneBlock,
  [ResourceType.CopperOre]: Icons.Ore,
  [ResourceType.IronOre]: Icons.Ore,
  [ResourceType.IronChunks]: Icons.Armor,
  [ResourceType.Coal]: Icons.StonePile,
  [ResourceType.RawFish]: Icons.Salmon,
  [ResourceType.CookedFish]: Icons.FriedFish,
  [ResourceType.Cloth]: Icons.Hood,
  [ResourceType.LeatherScraps]: Icons.AnimalHide,
  [ResourceType.ArcaneDust]: Icons.Sparkles,
  [ResourceType.RecipeBook]: Icons.BookCover,
};

const NamedItemIcon: Record<string, string> = {
  'Jerky Pack': Icons.ShinyApple,
  Totem: Icons.Totem,
  'Iron Chunks': Icons.StonePile,
  'Cooked Fish': Icons.FriedFish,
  'Recipe Book': Icons.BookCover,
  'Hearthshard Wayscroll': Icons.TiedScroll,
};

const NamedItemTint: Record<string, string> = {
  Gold: '#fbbf24',
  'Copper Ore': '#f59e0b',
  'Iron Ore': '#94a3b8',
  'Iron Chunks': '#94a3b8',
  Coal: '#475569',
  'Cooked Fish': '#f59e0b',
  'Recipe Book': '#c084fc',
  'Hearthshard Wayscroll': '#a78bfa',
};

const ItemKindIcon: Record<Exclude<Item['kind'], 'resource'>, string> = {
  weapon: Icons.Weapon,
  armor: DEFAULT_ITEM_ICON,
  artifact: DEFAULT_ITEM_ICON,
  consumable: Icons.Consumable,
};

export function enemyIconFor(name: string) {
  return EnemyIcon[name] ?? DEFAULT_ENEMY_ICON;
}

export function enemyTint(name: string) {
  return EnemyTint[name] ?? DEFAULT_ENEMY_TINT;
}

export function iconForItem(item?: Item, slot?: EquipmentSlot) {
  const slotIcon = slot ? ItemIcon[slot] : undefined;
  const itemSlotIcon = item?.slot ? ItemIcon[item.slot] : undefined;
  const namedItemIcon =
    item?.name && item.name.endsWith(' Totem')
      ? Icons.Totem
      : item?.name
        ? NamedItemIcon[item.name]
        : undefined;
  const resourceIcon =
    item?.kind === 'resource' ? ResourceIcon[item.name] : undefined;
  const kindIcon =
    item && item.kind !== 'resource' ? ItemKindIcon[item.kind] : undefined;

  return (
    namedItemIcon ??
    resourceIcon ??
    itemSlotIcon ??
    kindIcon ??
    slotIcon ??
    DEFAULT_ITEM_ICON ??
    DEFAULT_RESOURCE_ICON
  );
}

export function structureIconFor(structure: StructureType) {
  return StructureIcon[structure];
}

export function structureTint(structure: StructureType) {
  return StructureTint[structure];
}

export function itemTint(item?: Item) {
  if (!item) return rarityColor('common');
  return NamedItemTint[item.name] ?? rarityColor(item.rarity);
}
