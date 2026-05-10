import type { HexCoord } from './hex';
import type { Item } from './itemTypes';

export const TERRAINS = [
  'plains',
  'meadow',
  'steppe',
  'grove',
  'forest',
  'marsh',
  'rift',
  'blasted',
  'highlands',
  'mountain',
  'dunes',
  'badlands',
  'desert',
  'swamp',
  'dungeon-brick-floor',
  'dungeon-brick-cracked',
  'dungeon-brick-moss',
  'dungeon-brick-wall',
  'dungeon-mud-floor',
  'dungeon-mud-rut',
  'dungeon-mud-puddle',
  'dungeon-mud-wall',
  'dungeon-obsidian-floor',
  'dungeon-obsidian-ash',
  'dungeon-obsidian-ember',
  'dungeon-obsidian-wall',
] as const;

export type Terrain = (typeof TERRAINS)[number];

export const GATHERING_STRUCTURE_TYPES = [
  'flax',
  'herbs',
  'tree',
  'copper-ore',
  'tin-ore',
  'iron-ore',
  'gold-ore',
  'platinum-ore',
  'coal-ore',
  'pond',
  'lake',
] as const;

export type GatheringStructureType = (typeof GATHERING_STRUCTURE_TYPES)[number];

export const STRUCTURE_TYPES = [
  'forge',
  'rune-forge',
  'camp',
  'furnace',
  'mana-font',
  'mana-anchor',
  'workshop',
  'watchtower',
  'town',
  'corruption-altar',
  'dungeon',
  'dungeon-chest',
  'locked-chest',
  ...GATHERING_STRUCTURE_TYPES,
] as const;

export type StructureType = (typeof STRUCTURE_TYPES)[number];

export interface TerritoryNpc {
  name: string;
  enemyId?: string;
}

export type TerritoryOwnerType = 'player' | 'faction';

export interface TileClaim {
  ownerId: string;
  ownerType: TerritoryOwnerType;
  ownerName: string;
  borderColor: string;
  npc?: TerritoryNpc;
}

export type WorldFloatingTextAnchor =
  | { kind: 'player'; coord: HexCoord }
  | { kind: 'enemy'; enemyId: string; coord: HexCoord };

export type WorldFloatingTextKind = 'damage' | 'critical-damage' | 'healing';

export interface WorldFloatingTextEvent {
  id: string;
  anchor: WorldFloatingTextAnchor;
  amount: number;
  createdAtMs: number;
  kind: WorldFloatingTextKind;
}

export interface Tile {
  coord: HexCoord;
  terrain: Terrain;
  structure?: StructureType;
  structureHp?: number;
  structureMaxHp?: number;
  townStockDay?: number;
  townStockPurchasedItemIds?: string[];
  items: Item[];
  enemyIds: string[];
  claim?: TileClaim;
}
