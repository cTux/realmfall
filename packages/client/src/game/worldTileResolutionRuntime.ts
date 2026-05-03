import type { ResolvedWorldTilePayload } from '@realmfall/common';
import { normalizeConfiguredEnemyName } from './configuredEnemyName';
import type { Enemy, Item, PlayerStatusEffect, Tile, TileClaim } from './types';

export function hydrateResolvedWorldTilePayload(
  payload: ResolvedWorldTilePayload,
): {
  coord: ResolvedWorldTilePayload['coord'];
  tile: Tile;
  enemies: Enemy[];
} {
  return {
    coord: payload.coord,
    tile: hydrateTile(payload.tile),
    enemies: payload.enemies.map(hydrateEnemy),
  };
}

function hydrateTile(tile: ResolvedWorldTilePayload['tile']): Tile {
  return {
    coord: tile.coord,
    terrain: tile.terrain as Tile['terrain'],
    structure: tile.structure as Tile['structure'],
    structureHp: tile.structureHp,
    structureMaxHp: tile.structureMaxHp,
    townStockDay: tile.townStockDay,
    townStockPurchasedItemIds: tile.townStockPurchasedItemIds
      ? [...tile.townStockPurchasedItemIds]
      : undefined,
    items: tile.items.map(hydrateItem),
    enemyIds: [...tile.enemyIds],
    claim: tile.claim ? hydrateClaim(tile.claim) : undefined,
  };
}

function hydrateItem(
  item: ResolvedWorldTilePayload['tile']['items'][number],
): Item {
  return {
    id: item.id,
    itemKey: item.itemKey as Item['itemKey'],
    tags: item.tags as Item['tags'],
    recipeId: item.recipeId,
    locked: item.locked,
    slot: item.slot as Item['slot'],
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
          key: stat.key as NonNullable<Item['secondaryStats']>[number]['key'],
          value: stat.value,
        }))
      : undefined,
    reforgedSecondaryStatIndex: item.reforgedSecondaryStatIndex,
    enchantedSecondaryStatIndex: item.enchantedSecondaryStatIndex,
    corrupted: item.corrupted,
    grantedAbilityId: item.grantedAbilityId as Item['grantedAbilityId'],
  };
}

function hydrateEnemy(
  enemy: ResolvedWorldTilePayload['enemies'][number],
): Enemy {
  return {
    id: enemy.id,
    enemyTypeId: enemy.enemyTypeId as Enemy['enemyTypeId'],
    tags: enemy.tags as Enemy['tags'],
    name: normalizeConfiguredEnemyName(enemy.name, enemy.enemyTypeId),
    coord: enemy.coord,
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
    statusEffects: enemy.statusEffects?.map(hydrateStatusEffect),
    abilityIds: enemy.abilityIds as Enemy['abilityIds'],
  };
}

function hydrateStatusEffect(
  statusEffect: NonNullable<
    ResolvedWorldTilePayload['enemies'][number]['statusEffects']
  >[number],
): PlayerStatusEffect {
  return {
    id: statusEffect.id as PlayerStatusEffect['id'],
    tags: statusEffect.tags as PlayerStatusEffect['tags'],
    expiresAt: statusEffect.expiresAt,
    tickIntervalMs: statusEffect.tickIntervalMs,
    lastProcessedAt: statusEffect.lastProcessedAt,
    stacks: statusEffect.stacks,
    value: statusEffect.value,
  };
}

function hydrateClaim(
  claim: NonNullable<ResolvedWorldTilePayload['tile']['claim']>,
): TileClaim {
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
