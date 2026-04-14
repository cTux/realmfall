import type { HexCoord } from './hex';

export type Terrain =
  | 'plains'
  | 'forest'
  | 'rift'
  | 'mountain'
  | 'desert'
  | 'swamp';

export type GatheringStructureType =
  | 'herbs'
  | 'tree'
  | 'copper-ore'
  | 'iron-ore'
  | 'coal-ore'
  | 'pond'
  | 'lake';

export type StructureType =
  | 'forge'
  | 'camp'
  | 'workshop'
  | 'town'
  | 'dungeon'
  | GatheringStructureType;

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type SkillName =
  | 'logging'
  | 'mining'
  | 'skinning'
  | 'fishing'
  | 'cooking'
  | 'crafting';

export type EquipmentSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'ringLeft'
  | 'ringRight'
  | 'amulet'
  | 'cloak'
  | 'relic';

export type ItemKind =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'consumable'
  | 'resource';

export interface Item {
  id: string;
  itemKey?: string;
  kind: ItemKind;
  recipeId?: string;
  slot?: EquipmentSlot;
  name: string;
  quantity: number;
  tier: number;
  rarity: ItemRarity;
  power: number;
  defense: number;
  maxHp: number;
  healing: number;
  hunger: number;
  thirst?: number;
}

export interface Enemy {
  id: string;
  name: string;
  coord: HexCoord;
  tier: number;
  baseMaxHp?: number;
  hp: number;
  maxHp: number;
  baseAttack?: number;
  attack: number;
  baseDefense?: number;
  defense: number;
  xp: number;
  elite: boolean;
  worldBoss?: boolean;
  aggressive?: boolean;
}

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

export type AbilityId = 'kick';

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  manaCost: number;
  cooldownMs: number;
  castTimeMs: number;
}

export interface CombatCastState {
  abilityId: AbilityId;
  targetId: string;
  endsAt: number;
}

export interface CombatActorState {
  abilityIds: AbilityId[];
  globalCooldownMs: number;
  effectiveGlobalCooldownMs?: number;
  globalCooldownEndsAt: number;
  cooldownEndsAt: Partial<Record<AbilityId, number>>;
  effectiveCooldownMs?: Partial<Record<AbilityId, number>>;
  casting: CombatCastState | null;
}

export interface Tile {
  coord: HexCoord;
  terrain: Terrain;
  structure?: StructureType;
  structureHp?: number;
  structureMaxHp?: number;
  items: Item[];
  enemyIds: string[];
  claim?: TileClaim;
}

export type Equipment = Partial<Record<EquipmentSlot, Item>>;

export interface Player {
  coord: HexCoord;
  level: number;
  masteryLevel: number;
  xp: number;
  hp: number;
  baseMaxHp: number;
  mana: number;
  baseMaxMana: number;
  hunger: number;
  thirst?: number;
  baseAttack: number;
  baseDefense: number;
  skills: Record<SkillName, SkillProgress>;
  learnedRecipeIds: string[];
  inventory: Item[];
  equipment: Equipment;
  statusEffects: PlayerStatusEffect[];
}

export type StatusEffectId =
  | 'hunger'
  | 'thirst'
  | 'recentDeath'
  | 'restoration';

export interface PlayerStatusEffect {
  id: StatusEffectId;
  expiresAt?: number;
  tickIntervalMs?: number;
  lastProcessedAt?: number;
}

export interface SkillProgress {
  level: number;
  xp: number;
}

export interface CombatState {
  coord: HexCoord;
  enemyIds: string[];
  started: boolean;
  player: CombatActorState;
  enemies: Record<string, CombatActorState>;
}

export interface TownStockEntry {
  item: Item;
  price: number;
}

export interface RecipeRequirement {
  name: string;
  quantity: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  skill: Extract<SkillName, 'cooking' | 'crafting'>;
  output: Item;
  ingredients: RecipeRequirement[];
  fuelOptions?: RecipeRequirement[];
}

export type LogKind =
  | 'movement'
  | 'combat'
  | 'loot'
  | 'survival'
  | 'rumor'
  | 'motd'
  | 'system';

export interface LogEntry {
  id: string;
  kind: LogKind;
  text: string;
  turn: number;
}

export interface GameState {
  seed: string;
  radius: number;
  homeHex: HexCoord;
  turn: number;
  worldTimeMs: number;
  dayPhase: 'day' | 'night';
  bloodMoonActive: boolean;
  bloodMoonCheckedTonight: boolean;
  bloodMoonCycle: number;
  harvestMoonActive: boolean;
  harvestMoonCheckedTonight: boolean;
  harvestMoonCycle: number;
  lastEarthshakeDay: number;
  gameOver: boolean;
  logSequence: number;
  logs: LogEntry[];
  tiles: Record<string, Tile>;
  enemies: Record<string, Enemy>;
  player: Player;
  combat: CombatState | null;
}

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon',
  'offhand',
  'head',
  'chest',
  'hands',
  'legs',
  'feet',
  'ringLeft',
  'ringRight',
  'amulet',
  'cloak',
  'relic',
];

export const RARITY_ORDER: ItemRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];
