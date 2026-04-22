import type { HexCoord } from './hex';
import {
  EquipmentSlotId,
  type EnemyTypeKey,
  type EquipmentSlotValue,
  type ItemKey,
  type StatusEffectIdValue,
} from './content/ids';
import type { GameTag } from './content/tags';

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
] as const;

export type Terrain = (typeof TERRAINS)[number];

export const GATHERING_STRUCTURE_TYPES = [
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
  'workshop',
  'town',
  'corruption-altar',
  'dungeon',
  ...GATHERING_STRUCTURE_TYPES,
] as const;

export type StructureType = (typeof STRUCTURE_TYPES)[number];

export const RARITY_ORDER = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const;

export type ItemRarity = (typeof RARITY_ORDER)[number];
export type EnemyRarity = ItemRarity;
export type MainItemStatKey = 'power' | 'defense' | 'maxHp';
export type SecondaryStatKey =
  | 'attackSpeed'
  | 'criticalStrikeChance'
  | 'criticalStrikeDamage'
  | 'lifestealChance'
  | 'lifestealAmount'
  | 'dodgeChance'
  | 'blockChance'
  | 'suppressDamageChance'
  | 'suppressDamageReduction'
  | 'suppressDebuffChance'
  | 'bleedChance'
  | 'poisonChance'
  | 'burningChance'
  | 'chillingChance'
  | 'powerBuffChance'
  | 'frenzyBuffChance';

export interface ItemSecondaryStat {
  key: SecondaryStatKey;
  value: number;
}

export enum Skill {
  Gathering = 'gathering',
  Logging = 'logging',
  Mining = 'mining',
  Skinning = 'skinning',
  Fishing = 'fishing',
  Cooking = 'cooking',
  Smelting = 'smelting',
  Crafting = 'crafting',
}

export type SkillName = Skill;
export const SKILL_NAMES = Object.values(Skill) as SkillName[];

export type EquipmentSlot = EquipmentSlotValue;

export interface Item {
  id: string;
  itemKey?: ItemKey;
  tags?: GameTag[];
  recipeId?: string;
  locked?: boolean;
  slot?: EquipmentSlot;
  icon?: string;
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
  secondaryStatCapacity?: number;
  secondaryStats?: ItemSecondaryStat[];
  reforgedSecondaryStatIndex?: number;
  enchantedSecondaryStatIndex?: number;
  corrupted?: boolean;
  grantedAbilityId?: AbilityId;
}

export interface Enemy {
  id: string;
  enemyTypeId?: EnemyTypeKey;
  tags?: GameTag[];
  name: string;
  coord: HexCoord;
  rarity?: EnemyRarity;
  tier: number;
  baseMaxHp?: number;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  baseAttack?: number;
  attack: number;
  baseDefense?: number;
  defense: number;
  xp: number;
  elite: boolean;
  worldBoss?: boolean;
  aggressive?: boolean;
  statusEffects?: PlayerStatusEffect[];
  abilityIds?: AbilityId[];
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

export type AbilityId = string;

export type AbilityTarget =
  | 'self'
  | 'injuredAlly'
  | 'randomAlly'
  | 'allAllies'
  | 'enemy'
  | 'randomEnemy'
  | 'allEnemies';

export type AbilitySchool = 'melee' | 'fire' | 'lightning' | 'ice' | 'support';

export type AbilityEffectDefinition =
  | {
      kind: 'damage';
      powerMultiplier: number;
      flatPower?: number;
      statusEffectId?: StatusEffectId;
      statusChance?: number;
      durationMs?: number;
      tickIntervalMs?: number;
      stacks?: number;
      valueMultiplier?: number;
      valueFlat?: number;
      targetOverride?: AbilityTarget;
    }
  | {
      kind: 'heal';
      powerMultiplier: number;
      flatPower?: number;
      splitDivisor?: number;
      targetOverride?: AbilityTarget;
    }
  | {
      kind: 'applyStatus';
      statusEffectId: StatusEffectId;
      value: number;
      durationMs?: number;
      tickIntervalMs?: number;
      stacks?: number;
      permanent?: boolean;
      targetOverride?: AbilityTarget;
    };

export interface AbilityRuntimeDefinition {
  id: AbilityId;
  manaCost: number;
  cooldownMs: number;
  castTimeMs: number;
  target: AbilityTarget;
  school: AbilitySchool;
  category: 'attacking' | 'supportive';
  effects: AbilityEffectDefinition[];
  aiPriority?: number;
  tags?: GameTag[];
}

export interface AbilityDefinition extends AbilityRuntimeDefinition {
  name: string;
  description: string;
  icon: string;
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
  consumableCooldownEndsAt?: number;
}

export type StatusEffectId = StatusEffectIdValue;

export interface PlayerStatusEffect {
  id: StatusEffectId;
  tags?: GameTag[];
  expiresAt?: number;
  tickIntervalMs?: number;
  lastProcessedAt?: number;
  stacks?: number;
  value?: number;
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
  itemKey?: string;
  name: string;
  quantity: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  skill: Skill.Cooking | Skill.Smelting | Skill.Crafting;
  output: Item;
  ingredients: RecipeRequirement[];
  fuelOptions?: RecipeRequirement[];
}

export interface RecipeBookEntry extends RecipeDefinition {
  learned: boolean;
}

export const LOG_KINDS = [
  'movement',
  'combat',
  'loot',
  'survival',
  'rumor',
  'motd',
  'system',
] as const;

export type LogKind = (typeof LOG_KINDS)[number];

export interface LogEntry {
  id: string;
  kind: LogKind;
  text: string;
  turn: number;
  richText?: LogRichSegment[];
}

export type LogRichSegment =
  | { kind: 'text'; text: string }
  | { kind: 'entity'; text: string; rarity?: EnemyRarity }
  | { kind: 'damage'; text: string }
  | { kind: 'healing'; text: string }
  | {
      kind: 'source';
      text: string;
      source:
        | {
            kind: 'ability';
            abilityId: AbilityId;
            attack?: number;
          }
        | {
            kind: 'statusEffect';
            effectId: StatusEffectId;
            tone?: 'buff' | 'debuff';
            value?: number;
            tickIntervalMs?: number;
            stacks?: number;
          };
    };

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
  EquipmentSlotId.Weapon,
  EquipmentSlotId.Offhand,
  EquipmentSlotId.Head,
  EquipmentSlotId.Shoulders,
  EquipmentSlotId.Chest,
  EquipmentSlotId.Bracers,
  EquipmentSlotId.Hands,
  EquipmentSlotId.Belt,
  EquipmentSlotId.Legs,
  EquipmentSlotId.Feet,
  EquipmentSlotId.RingLeft,
  EquipmentSlotId.RingRight,
  EquipmentSlotId.Amulet,
  EquipmentSlotId.Cloak,
];
