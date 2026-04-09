import type { EquipmentSlot, Item } from '../game/state';
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
import stonePileIcon from '../assets/icons/stone-pile.svg';
import axeInStumpIcon from '../assets/icons/axe-in-stump.svg';
import spillIcon from '../assets/icons/spill.svg';
import type { StructureType } from '../game/state';

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
  StonePile: stonePileIcon,
  AxeInStump: axeInStumpIcon,
  Spill: spillIcon,
} as const;

export const EnemyType = {
  Raider: 'Raider',
  Marauder: 'Marauder',
  Wolf: 'Wolf',
  Boar: 'Boar',
  Stag: 'Stag',
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
  Cloth: 'Cloth',
  LeatherScraps: 'Leather Scraps',
  ArcaneDust: 'Arcane Dust',
} as const;

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
};

export const EnemyTint: Record<string, number> = {
  [EnemyType.Raider]: 0xef4444,
  [EnemyType.Marauder]: 0xa855f7,
  [EnemyType.Wolf]: 0x60a5fa,
  [EnemyType.Boar]: 0xf59e0b,
  [EnemyType.Stag]: 0x22c55e,
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
  tree: Icons.AxeInStump,
  'copper-ore': Icons.StonePile,
  'iron-ore': Icons.StonePile,
  'coal-ore': Icons.StonePile,
  pond: Icons.Spill,
  lake: Icons.Spill,
};

export const StructureTint: Record<StructureType, number> = {
  town: 0xfbbf24,
  forge: 0xf97316,
  dungeon: 0xa855f7,
  tree: 0x22c55e,
  'copper-ore': 0xf59e0b,
  'iron-ore': 0x94a3b8,
  'coal-ore': 0x475569,
  pond: 0x38bdf8,
  lake: 0x2563eb,
};

export const ResourceIcon: Record<string, string> = {
  [ResourceType.Gold]: Icons.Orb,
  [ResourceType.Herbs]: Icons.Consumable,
  [ResourceType.Logs]: Icons.Weapon,
  [ResourceType.Sticks]: Icons.Weapon,
  [ResourceType.Stone]: Icons.Orb,
  [ResourceType.CopperOre]: Icons.Armor,
  [ResourceType.IronOre]: Icons.Armor,
  [ResourceType.IronChunks]: Icons.Armor,
  [ResourceType.Coal]: Icons.HornedHelm,
  [ResourceType.RawFish]: Icons.Consumable,
  [ResourceType.Cloth]: Icons.Hood,
  [ResourceType.LeatherScraps]: Icons.Hood,
  [ResourceType.ArcaneDust]: Icons.Orb,
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
  const resourceIcon =
    item?.kind === 'resource' ? ResourceIcon[item.name] : undefined;
  const kindIcon =
    item && item.kind !== 'resource' ? ItemKindIcon[item.kind] : undefined;

  return (
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
