import { BLOOD_MOON_STAT_SCALE, pickBloodMoonItemKind } from './config';
import {
  buildEnemyAbilityIds,
  DEFAULT_ABILITY_ID,
} from './abilities';
import { isAnimalEnemyType, pickEnemyConfig } from './content/enemies';
import { GAME_TAGS, uniqueTags } from './content/tags';
import type {
  AbilityId,
  CombatActorState,
  EnemyRarity,
  Enemy,
  StructureType,
  Terrain,
} from './types';
import type { HexCoord } from './hex';
import {
  noise,
  resolveCascadingRarity,
  terrainTier,
  withCascadingRarityChanceBonus,
} from './shared';
import { createRng } from './random';
import { isWorldBossEnemyId } from './worldBoss';

export const DEFAULT_GLOBAL_COOLDOWN_MS = 1500;
export const DEFAULT_ENEMY_MANA = 100;
export const ENEMY_RARITY_ORDER: EnemyRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

export function enemyKey(coord: HexCoord, index: number) {
  return `enemy-${coord.q},${coord.r}-${index}`;
}

export function createCombatActorState(
  worldTimeMs: number,
  abilityIds: AbilityId[] = [DEFAULT_ABILITY_ID],
  globalCooldownMs = DEFAULT_GLOBAL_COOLDOWN_MS,
): CombatActorState {
  return {
    abilityIds: [...abilityIds],
    globalCooldownMs,
    effectiveGlobalCooldownMs: globalCooldownMs,
    globalCooldownEndsAt: worldTimeMs,
    cooldownEndsAt: {},
    effectiveCooldownMs: {},
    casting: null,
  };
}

export function enemyIndexFromId(enemyId: string) {
  const parts = enemyId.split('-');
  return Number(parts[parts.length - 1] ?? '0') || 0;
}

export function enemyRarityIndex(rarity?: EnemyRarity) {
  return ENEMY_RARITY_ORDER.indexOf(rarity ?? 'common');
}

export function enemyRarityMultiplier(rarity?: EnemyRarity) {
  switch (rarity ?? 'common') {
    case 'uncommon':
      return 1.12;
    case 'rare':
      return 1.27;
    case 'epic':
      return 1.45;
    case 'legendary':
      return 1.72;
    default:
      return 1;
  }
}

export function enemyRarityMinimum(
  structure?: StructureType,
  worldBoss = false,
): EnemyRarity {
  if (worldBoss) return 'legendary';
  if (structure === 'dungeon') return 'uncommon';
  return 'common';
}

export function resolveEnemyRarity(
  nextRoll: () => number,
  minimum: EnemyRarity = 'common',
  tier = 1,
  structure?: StructureType,
) {
  const tierBonus =
    Math.min(0.18, tier * 0.02) + (structure === 'dungeon' ? 0.16 : 0);

  return resolveCascadingRarity(
    nextRoll,
    minimum,
    withCascadingRarityChanceBonus({
      legendary: tierBonus * 0.08,
      epic: tierBonus * 0.24,
      rare: tierBonus * 0.55,
      uncommon: tierBonus,
    }),
  );
}

export function makeEnemy(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
  index = 0,
  structure?: StructureType,
  bloodMoonActive = false,
  options?: {
    enemyId?: string;
    aggressive?: boolean;
    name?: string;
    worldBoss?: boolean;
  },
): Enemy {
  const tier = terrainTier(coord, terrain) + (structure === 'dungeon' ? 2 : 0);
  const roll = noise(`${seed}:enemy:type:${structure ?? 'field'}`, coord);
  const worldBoss =
    options?.worldBoss ?? isWorldBossEnemyId(options?.enemyId ?? '');
  const rarity = worldBoss
    ? 'legendary'
    : resolveEnemyRarity(
        createRng(`${seed}:enemy:rarity:${index}:${coord.q}:${coord.r}`),
        enemyRarityMinimum(structure, worldBoss),
        tier,
        structure,
      );
  const rarityRank = enemyRarityIndex(rarity);
  const rarityMultiplier = enemyRarityMultiplier(rarity);
  const elite = rarityRank >= enemyRarityIndex('rare');
  const config = worldBoss
    ? pickEnemyConfig(terrain, roll, false, true)
    : pickEnemyConfig(terrain, roll, structure === 'dungeon');
  const statTier = tier + Math.floor(rarityRank / 2);
  const baseMaxHp = Math.round(
    (8 + tier * 6 + (structure === 'dungeon' ? 6 : 0)) * rarityMultiplier +
      rarityRank * 2,
  );
  const baseAttack = Math.round(
    (2 + tier * 2 + (structure === 'dungeon' ? 1 : 0)) * rarityMultiplier,
  );
  const baseDefense = Math.round(
    Math.max(
      1,
      (1 + tier + (structure === 'dungeon' ? 1 : 0)) * rarityMultiplier,
    ),
  );
  const scaledMaxHp = worldBoss ? baseMaxHp * 50 : baseMaxHp;
  const scaledAttack = worldBoss ? baseAttack * 5 : baseAttack;
  const scaledDefense = worldBoss
    ? Math.max(baseDefense + statTier * 3, baseDefense * 3)
    : baseDefense;
  const enemy: Enemy = {
    id: options?.enemyId ?? enemyKey(coord, index),
    enemyTypeId: config.id,
    tags: uniqueTags(
      ...(config.tags ?? []),
      elite ? GAME_TAGS.enemy.elite : undefined,
      structure === 'dungeon' ? GAME_TAGS.enemy.dungeon : undefined,
    ),
    name: options?.name ?? config.name,
    coord,
    rarity,
    tier: worldBoss ? statTier + 3 : statTier,
    baseMaxHp: worldBoss ? scaledMaxHp : baseMaxHp,
    maxHp: scaledMaxHp,
    hp: scaledMaxHp,
    mana: DEFAULT_ENEMY_MANA,
    maxMana: DEFAULT_ENEMY_MANA,
    baseAttack: worldBoss ? scaledAttack : baseAttack,
    attack: scaledAttack,
    baseDefense: worldBoss ? scaledDefense : baseDefense,
    defense: scaledDefense,
    xp: Math.round(
      (18 +
        statTier * 14 +
        rarityRank * 12 +
        (structure === 'dungeon' ? 8 : 0)) *
        (worldBoss ? 10 : 1),
    ),
    elite: elite || worldBoss,
    worldBoss,
    aggressive: options?.aggressive ?? true,
    abilityIds: buildEnemyAbilityIds(
      {
        id: options?.enemyId ?? enemyKey(coord, index),
        rarity,
        worldBoss,
        tags: uniqueTags(
          ...(config.tags ?? []),
          elite ? GAME_TAGS.enemy.elite : undefined,
          structure === 'dungeon' ? GAME_TAGS.enemy.dungeon : undefined,
        ),
        enemyTypeId: config.id,
      },
      seed,
    ),
  };

  setEnemyBloodMoonState(enemy, bloodMoonActive);
  return enemy;
}

export function syncEnemyBloodMoonState(
  enemies: Record<string, Enemy>,
  active: boolean,
) {
  Object.values(enemies).forEach((enemy) => {
    setEnemyBloodMoonState(enemy, active);
  });
}

export function nextEnemySpawnIndex(enemyIds: string[]) {
  return (
    enemyIds.reduce(
      (highest, enemyId) => Math.max(highest, enemyIndexFromId(enemyId)),
      -1,
    ) + 1
  );
}

export function makeBloodMoonDropKind(
  roll: number,
): 'artifact' | 'weapon' | 'offhand' | 'armor' {
  return pickBloodMoonItemKind(roll);
}

export function isAnimalEnemy(
  enemy: Pick<Enemy, 'enemyTypeId' | 'name' | 'tags'> | string,
) {
  if (typeof enemy === 'string') {
    return isAnimalEnemyType(enemy);
  }

  return (
    enemy.tags?.includes(GAME_TAGS.enemy.animal) ??
    isAnimalEnemyType(enemy.enemyTypeId ?? enemy.name)
  );
}

export function scaledBloodMoonStat(value: number) {
  return Math.max(1, Math.round(value * BLOOD_MOON_STAT_SCALE));
}

function setEnemyBloodMoonState(enemy: Enemy, active: boolean) {
  const baseMaxHp = enemy.baseMaxHp ?? enemy.maxHp;
  const baseAttack = enemy.baseAttack ?? enemy.attack;
  const baseDefense = enemy.baseDefense ?? enemy.defense;
  const currentRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const maxHp = active ? scaledBloodMoonStat(baseMaxHp) : baseMaxHp;

  enemy.baseMaxHp = baseMaxHp;
  enemy.baseAttack = baseAttack;
  enemy.baseDefense = baseDefense;
  enemy.maxHp = maxHp;
  enemy.hp = Math.max(0, Math.min(maxHp, Math.round(maxHp * currentRatio)));
  enemy.attack = active ? scaledBloodMoonStat(baseAttack) : baseAttack;
  enemy.defense = active ? scaledBloodMoonStat(baseDefense) : baseDefense;
}
