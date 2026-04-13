import playerIcon from '../../assets/icons/visored-helm.svg';
import enemyIcon from '../../assets/icons/wolf-head.svg';
import hoodIcon from '../../assets/icons/hood.svg';
import hornedHelmIcon from '../../assets/icons/horned-helm.svg';
import villageIcon from '../../assets/icons/village.svg';
import dungeonGateIcon from '../../assets/icons/dungeon-gate.svg';
import anvilIcon from '../../assets/icons/anvil.svg';
import axeInStumpIcon from '../../assets/icons/axe-in-stump.svg';
import herbsBundleIcon from '../../assets/icons/herbs-bundle.svg';
import oreIcon from '../../assets/icons/ore.svg';
import spillIcon from '../../assets/icons/spill.svg';
import sunCloudIcon from '../../assets/icons/sun-cloud.svg';
import rainingIcon from '../../assets/icons/raining.svg';
import snowingIcon from '../../assets/icons/snowing.svg';
import spiderAltIcon from '../../assets/icons/spider-alt.svg';
import campCookingPotIcon from '../../assets/icons/camp-cooking-pot.svg';
import stoneCraftingIcon from '../../assets/icons/stone-crafting.svg';
import type { StructureType } from '../../game/state';

export const WorldIcons = {
  Player: playerIcon,
  Enemy: enemyIcon,
  Hood: hoodIcon,
  HornedHelm: hornedHelmIcon,
  Village: villageIcon,
  DungeonGate: dungeonGateIcon,
  Anvil: anvilIcon,
  AxeInStump: axeInStumpIcon,
  HerbsBundle: herbsBundleIcon,
  Ore: oreIcon,
  Spill: spillIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  Spider: spiderAltIcon,
  CampCookingPot: campCookingPotIcon,
  StoneCrafting: stoneCraftingIcon,
} as const;

const DEFAULT_ENEMY_ICON = WorldIcons.Enemy;

const ENEMY_ICONS: Record<string, string> = {
  Raider: WorldIcons.Hood,
  Marauder: WorldIcons.HornedHelm,
  Wolf: WorldIcons.Enemy,
  Boar: WorldIcons.Enemy,
  Stag: WorldIcons.Enemy,
  Spider: WorldIcons.Spider,
};

const STRUCTURE_ICONS: Record<StructureType, string> = {
  town: WorldIcons.Village,
  dungeon: WorldIcons.DungeonGate,
  forge: WorldIcons.Anvil,
  camp: WorldIcons.CampCookingPot,
  workshop: WorldIcons.StoneCrafting,
  herbs: WorldIcons.HerbsBundle,
  tree: WorldIcons.AxeInStump,
  'copper-ore': WorldIcons.Ore,
  'iron-ore': WorldIcons.Ore,
  'coal-ore': WorldIcons.Ore,
  pond: WorldIcons.Spill,
  lake: WorldIcons.Spill,
};

export function enemyIconFor(name: string) {
  return ENEMY_ICONS[name] ?? DEFAULT_ENEMY_ICON;
}

export function structureIconFor(structure: StructureType) {
  return STRUCTURE_ICONS[structure];
}
