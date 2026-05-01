export interface TileResolutionCoord {
  q: number;
  r: number;
}

export interface TileResolutionNpc {
  name: string;
  enemyId?: string;
}

export interface TileResolutionClaim {
  ownerId: string;
  ownerType: 'player' | 'faction';
  ownerName: string;
  borderColor: string;
  npc?: TileResolutionNpc;
}

type TileResolutionRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface TileResolutionItem {
  id: string;
  itemKey?: string;
  tags?: string[];
  recipeId?: string;
  locked?: boolean;
  slot?: string;
  icon?: string;
  name: string;
  quantity: number;
  tier: number;
  rarity: TileResolutionRarity;
  requiredLevel?: number;
  power: number;
  defense: number;
  maxHp: number;
  healing: number;
  hunger: number;
  thirst?: number;
  secondaryStatCapacity?: number;
  secondaryStats?: Array<{ key: string; value: number }>;
  reforgedSecondaryStatIndex?: number;
  enchantedSecondaryStatIndex?: number;
  corrupted?: boolean;
  grantedAbilityId?: string;
}

export interface TileResolutionEnemy {
  id: string;
  enemyTypeId?: string;
  tags?: string[];
  name: string;
  coord: TileResolutionCoord;
  rarity?: TileResolutionRarity;
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
  statusEffects?: TileResolutionStatusEffect[];
  abilityIds?: string[];
}

export interface TileResolutionStatusEffect {
  id: string;
  tags?: string[];
  expiresAt?: number;
  tickIntervalMs?: number;
  lastProcessedAt?: number;
  stacks?: number;
  value?: number;
}

export interface TileResolutionTile {
  coord: TileResolutionCoord;
  terrain: string;
  structure?: string;
  structureHp?: number;
  structureMaxHp?: number;
  townStockDay?: number;
  townStockPurchasedItemIds?: string[];
  items: TileResolutionItem[];
  enemyIds: string[];
  claim?: TileResolutionClaim;
}

export interface ResolvedWorldTilePayload {
  coord: TileResolutionCoord;
  tile: TileResolutionTile;
  enemies: TileResolutionEnemy[];
}

export interface ResolveWorldTilesRequest {
  requestId: string;
  seed: string;
  bloodMoonActive: boolean;
  coords: TileResolutionCoord[];
}

export interface ResolveWorldTilesResponse {
  requestId: string;
  tiles: ResolvedWorldTilePayload[];
}
