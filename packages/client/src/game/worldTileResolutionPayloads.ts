import type {
  TileResolutionClaim,
  TileResolutionCoord,
  TileResolutionEnemy,
  TileResolutionItem,
  TileResolutionStatusEffect,
  TileResolutionTile,
  ResolvedWorldTilePayload,
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import { enemyIndexFromId, makeEnemy } from './combat';
import { isFactionNpcEnemyId } from './territories';
import { buildTile } from './world';
import { isWorldBossEnemyId } from './worldBoss';

export function resolveWorldTiles(
  request: ResolveWorldTilesRequest,
): ResolveWorldTilesResponse {
  return {
    requestId: request.requestId,
    tiles: request.coords.map((coord) =>
      buildResolvedWorldTilePayload(
        request.seed,
        coord,
        request.bloodMoonActive,
      ),
    ),
  };
}

function buildResolvedWorldTilePayload(
  seed: string,
  coord: ResolveWorldTilesRequest['coords'][number],
  bloodMoonActive: boolean,
): ResolvedWorldTilePayload {
  const runtimeTile = buildTile(seed, coord);
  const tile = mapTile(runtimeTile);
  const enemies = runtimeTile.enemyIds.map((enemyId) =>
    mapEnemy(
      makeEnemy(
        seed,
        coord,
        runtimeTile.terrain,
        enemyIndexFromId(enemyId),
        runtimeTile.structure,
        bloodMoonActive,
        {
          enemyId,
          aggressive: !isFactionNpcEnemyId(enemyId),
          name:
            runtimeTile.claim?.npc?.enemyId === enemyId
              ? runtimeTile.claim.npc.name
              : undefined,
          worldBoss: isWorldBossEnemyId(enemyId),
        },
      ),
    ),
  );

  return {
    coord: mapCoord(coord),
    tile,
    enemies,
  };
}

function mapCoord(coord: TileResolutionCoord): TileResolutionCoord {
  return {
    q: coord.q,
    r: coord.r,
  };
}

function mapTile(tile: {
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
}): TileResolutionTile {
  return {
    coord: mapCoord(tile.coord),
    terrain: tile.terrain,
    structure: tile.structure,
    structureHp: tile.structureHp,
    structureMaxHp: tile.structureMaxHp,
    townStockDay: tile.townStockDay,
    townStockPurchasedItemIds: tile.townStockPurchasedItemIds
      ? [...tile.townStockPurchasedItemIds]
      : undefined,
    items: tile.items.map(mapItem),
    enemyIds: [...tile.enemyIds],
    claim: tile.claim ? mapClaim(tile.claim) : undefined,
  };
}

function mapItem(item: TileResolutionItem): TileResolutionItem {
  return {
    id: item.id,
    itemKey: item.itemKey,
    tags: item.tags ? [...item.tags] : undefined,
    recipeId: item.recipeId,
    locked: item.locked,
    slot: item.slot,
    icon: item.icon,
    name: item.name,
    quantity: item.quantity,
    tier: item.tier,
    rarity: item.rarity,
    requiredLevel: item.requiredLevel,
    power: item.power,
    defense: item.defense,
    maxHp: item.maxHp,
    healing: item.healing,
    hunger: item.hunger,
    thirst: item.thirst,
    secondaryStatCapacity: item.secondaryStatCapacity,
    secondaryStats: item.secondaryStats
      ? item.secondaryStats.map((stat) => ({
          key: stat.key,
          value: stat.value,
        }))
      : undefined,
    reforgedSecondaryStatIndex: item.reforgedSecondaryStatIndex,
    enchantedSecondaryStatIndex: item.enchantedSecondaryStatIndex,
    corrupted: item.corrupted,
    grantedAbilityId: item.grantedAbilityId,
  };
}

function mapEnemy(enemy: TileResolutionEnemy): TileResolutionEnemy {
  return {
    id: enemy.id,
    enemyTypeId: enemy.enemyTypeId,
    tags: enemy.tags ? [...enemy.tags] : undefined,
    name: enemy.name,
    coord: mapCoord(enemy.coord),
    rarity: enemy.rarity,
    tier: enemy.tier,
    baseMaxHp: enemy.baseMaxHp,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    mana: enemy.mana,
    maxMana: enemy.maxMana,
    baseAttack: enemy.baseAttack,
    attack: enemy.attack,
    baseDefense: enemy.baseDefense,
    defense: enemy.defense,
    xp: enemy.xp,
    elite: enemy.elite,
    worldBoss: enemy.worldBoss,
    aggressive: enemy.aggressive,
    statusEffects: enemy.statusEffects?.map(mapStatusEffect),
    abilityIds: enemy.abilityIds ? [...enemy.abilityIds] : undefined,
  };
}

function mapStatusEffect(
  statusEffect: TileResolutionStatusEffect,
): TileResolutionStatusEffect {
  return {
    id: statusEffect.id,
    tags: statusEffect.tags ? [...statusEffect.tags] : undefined,
    expiresAt: statusEffect.expiresAt,
    tickIntervalMs: statusEffect.tickIntervalMs,
    lastProcessedAt: statusEffect.lastProcessedAt,
    stacks: statusEffect.stacks,
    value: statusEffect.value,
  };
}

function mapClaim(claim: TileResolutionClaim): TileResolutionClaim {
  return {
    ownerId: claim.ownerId,
    ownerType: claim.ownerType,
    ownerName: claim.ownerName,
    borderColor: claim.borderColor,
    npc: claim.npc
      ? {
          name: claim.npc.name,
          enemyId: claim.npc.enemyId,
        }
      : undefined,
  };
}
