import { GAME_TAGS } from './content/tags';
import { createRng } from './random';
import { DEFAULT_ABILITY_ID, getAbilityDefinition } from './abilityCatalog';
import type { AbilityId, Enemy, Item } from './types';

const BEAST_ABILITY_POOL: AbilityId[] = [
  'slash',
  'hamstring',
  'whirlwind',
  'frostShard',
  'coldSnap',
  'ironGuard',
];

const HUMANOID_ABILITY_POOL: AbilityId[] = [
  'slash',
  'crushingBlow',
  'impale',
  'emberShot',
  'sparkJolt',
  'arcBolt',
  'rallyingCry',
  'battlePrayer',
  'sunderArmor',
];

const ABERRATION_ABILITY_POOL: AbilityId[] = [
  'fireball',
  'searingNova',
  'wildfire',
  'chainLightning',
  'stormSurge',
  'freezingWave',
  'blizzard',
  'mendWounds',
  'soothingMist',
  'warBanner',
  'enfeeblingPulse',
];

export function sortAbilityIdsForCombat(abilityIds: AbilityId[]) {
  return [...new Set(abilityIds)].sort((left, right) => {
    const leftDefinition = getAbilityDefinition(left);
    const rightDefinition = getAbilityDefinition(right);
    const leftPriority =
      (leftDefinition.aiPriority ?? 0) +
      leftDefinition.cooldownMs +
      (left === DEFAULT_ABILITY_ID ? -100_000 : 0);
    const rightPriority =
      (rightDefinition.aiPriority ?? 0) +
      rightDefinition.cooldownMs +
      (right === DEFAULT_ABILITY_ID ? -100_000 : 0);

    return rightPriority - leftPriority;
  });
}

export function enemyAbilityCount(enemy: Pick<Enemy, 'rarity' | 'worldBoss'>) {
  if (enemy.worldBoss || enemy.rarity === 'legendary') return 3;
  if (enemy.rarity === 'rare' || enemy.rarity === 'epic') return 2;
  if (enemy.rarity === 'uncommon') return 1;
  return 0;
}

export function buildEnemyAbilityIds(
  enemy: Pick<Enemy, 'id' | 'rarity' | 'worldBoss' | 'tags' | 'enemyTypeId'>,
  seed: string,
) {
  const count = enemyAbilityCount(enemy);
  if (count <= 0) return [DEFAULT_ABILITY_ID];

  const pool = enemy.tags?.includes(GAME_TAGS.enemy.aberration)
    ? [...ABERRATION_ABILITY_POOL, ...HUMANOID_ABILITY_POOL]
    : enemy.tags?.includes(GAME_TAGS.enemy.humanoid)
      ? HUMANOID_ABILITY_POOL
      : enemy.worldBoss
        ? [
            ...ABERRATION_ABILITY_POOL,
            ...HUMANOID_ABILITY_POOL,
            ...BEAST_ABILITY_POOL,
          ]
        : BEAST_ABILITY_POOL;
  const remaining = [...new Set(pool)];
  const rng = createRng(`${seed}:enemy-abilities:${enemy.id}`);
  const selected: AbilityId[] = [];

  while (selected.length < count && remaining.length > 0) {
    const index = Math.floor(rng() * remaining.length);
    const [abilityId] = remaining.splice(index, 1);
    if (abilityId) selected.push(abilityId);
  }

  return sortAbilityIdsForCombat([DEFAULT_ABILITY_ID, ...selected]);
}

export function buildEquippedAbilityIds(items: Array<Item | undefined>) {
  const granted = items.flatMap((item) =>
    item?.grantedAbilityId ? [item.grantedAbilityId] : [],
  );

  return sortAbilityIdsForCombat([DEFAULT_ABILITY_ID, ...granted]);
}
