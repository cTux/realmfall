import { syncPlayerBaseStats } from '../game/balance';
import { getEnemyConfig } from '../game/content/enemies';
import { consolidateInventory } from '../game/inventory';
import { createGame } from '../game/stateFactory';
import type { Enemy, GameState, Item } from '../game/stateTypes';
import { normalizeCombatState } from './normalizeCombat';
import { resolveLegacyEnemyTypeId } from './normalizeCompatibility';
import { normalizeItem, normalizeStatusEffects } from './normalizeItems';
import {
  getSkillNames,
  isDayPhase,
  isEquipmentSlot,
  isFiniteNumber,
  isItemRarity,
  isRecord,
  isStringArray,
  isStructure,
  isTerrain,
  normalizeEnemyTypeId,
  normalizeHexCoord,
} from './normalizeShared';

export function normalizeLoadedGame(game: unknown): GameState | null {
  if (!isRecord(game)) {
    return null;
  }

  const baseline = createNormalizationBaseline(game);
  const homeHex = normalizeHexCoord(game.homeHex) ?? baseline.homeHex;
  const player = normalizePlayer(game.player, baseline.player);
  const combat =
    game.combat === null
      ? null
      : (normalizeCombatState(game.combat) ?? baseline.combat);
  const tiles = normalizeTiles(game.tiles, baseline.tiles);
  const enemies = normalizeEnemies(game.enemies, baseline.enemies);

  return {
    ...baseline,
    seed: typeof game.seed === 'string' ? game.seed : baseline.seed,
    radius: isFiniteNumber(game.radius) ? game.radius : baseline.radius,
    homeHex,
    turn: isFiniteNumber(game.turn) ? game.turn : baseline.turn,
    worldTimeMs: isFiniteNumber(game.worldTimeMs)
      ? game.worldTimeMs
      : baseline.worldTimeMs,
    dayPhase: isDayPhase(game.dayPhase) ? game.dayPhase : baseline.dayPhase,
    bloodMoonActive:
      typeof game.bloodMoonActive === 'boolean'
        ? game.bloodMoonActive
        : baseline.bloodMoonActive,
    bloodMoonCheckedTonight:
      typeof game.bloodMoonCheckedTonight === 'boolean'
        ? game.bloodMoonCheckedTonight
        : baseline.bloodMoonCheckedTonight,
    bloodMoonCycle: isFiniteNumber(game.bloodMoonCycle)
      ? game.bloodMoonCycle
      : baseline.bloodMoonCycle,
    harvestMoonActive:
      typeof game.harvestMoonActive === 'boolean'
        ? game.harvestMoonActive
        : baseline.harvestMoonActive,
    harvestMoonCheckedTonight:
      typeof game.harvestMoonCheckedTonight === 'boolean'
        ? game.harvestMoonCheckedTonight
        : baseline.harvestMoonCheckedTonight,
    harvestMoonCycle: isFiniteNumber(game.harvestMoonCycle)
      ? game.harvestMoonCycle
      : baseline.harvestMoonCycle,
    lastEarthshakeDay: isFiniteNumber(game.lastEarthshakeDay)
      ? game.lastEarthshakeDay
      : baseline.lastEarthshakeDay,
    gameOver:
      typeof game.gameOver === 'boolean' ? game.gameOver : baseline.gameOver,
    playerLevelUpVisualEndsAt: isFiniteNumber(game.playerLevelUpVisualEndsAt)
      ? game.playerLevelUpVisualEndsAt
      : baseline.playerLevelUpVisualEndsAt,
    logSequence: isFiniteNumber(game.logSequence)
      ? game.logSequence
      : baseline.logSequence,
    logs: [],
    tiles,
    enemies,
    player,
    combat,
  };
}

function createNormalizationBaseline(game: Record<string, unknown>) {
  const radius = isFiniteNumber(game.radius) ? game.radius : undefined;
  const seed = typeof game.seed === 'string' ? game.seed : undefined;
  return createGame(radius, seed);
}

function normalizeTiles(
  value: unknown,
  fallback: GameState['tiles'],
): GameState['tiles'] {
  if (!isRecord(value)) {
    return cloneTiles(fallback);
  }

  const tiles = cloneTiles(fallback);

  for (const [key, tile] of Object.entries(value)) {
    const normalizedTile = normalizeTile(tile, fallback[key]);
    if (normalizedTile) {
      tiles[key] = normalizedTile;
    }
  }

  return tiles;
}

function normalizeEnemies(
  value: unknown,
  fallback: GameState['enemies'],
): GameState['enemies'] {
  if (!isRecord(value)) {
    return cloneEnemies(fallback);
  }

  const enemies = cloneEnemies(fallback);

  for (const [key, enemy] of Object.entries(value)) {
    const normalizedEnemy = normalizeEnemy(enemy, fallback[key]);
    if (normalizedEnemy) {
      enemies[key] = normalizedEnemy;
    }
  }

  return enemies;
}

function normalizeTile(
  value: unknown,
  fallback?: GameState['tiles'][string],
): GameState['tiles'][string] | null {
  if (!isRecord(value)) {
    return fallback ? cloneTile(fallback) : null;
  }

  const coord = normalizeHexCoord(value.coord) ?? fallback?.coord ?? null;
  const items = normalizeItemArray(value.items, fallback?.items ?? []);
  const claim = normalizeTileClaim(value.claim);

  if (!coord) {
    return null;
  }

  return {
    coord,
    terrain: isTerrain(value.terrain)
      ? value.terrain
      : (fallback?.terrain ?? 'plains'),
    ...(isStructure(value.structure)
      ? { structure: value.structure }
      : fallback?.structure === undefined
        ? {}
        : { structure: fallback.structure }),
    ...(isFiniteNumber(value.structureHp)
      ? { structureHp: value.structureHp }
      : fallback?.structureHp === undefined
        ? {}
        : { structureHp: fallback.structureHp }),
    ...(isFiniteNumber(value.structureMaxHp)
      ? { structureMaxHp: value.structureMaxHp }
      : fallback?.structureMaxHp === undefined
        ? {}
        : { structureMaxHp: fallback.structureMaxHp }),
    items,
    enemyIds: isStringArray(value.enemyIds)
      ? [...value.enemyIds]
      : [...(fallback?.enemyIds ?? [])],
    ...(claim === null
      ? fallback?.claim === undefined
        ? {}
        : { claim: fallback.claim }
      : claim === undefined
        ? fallback?.claim === undefined
          ? {}
          : { claim: fallback.claim }
        : { claim }),
  };
}

function normalizeTileClaim(
  value: unknown,
): GameState['tiles'][string]['claim'] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.ownerId !== 'string' ||
    (value.ownerType !== 'player' && value.ownerType !== 'faction') ||
    typeof value.ownerName !== 'string' ||
    typeof value.borderColor !== 'string'
  ) {
    return null;
  }

  if (value.npc !== undefined) {
    if (!isRecord(value.npc) || typeof value.npc.name !== 'string') {
      return null;
    }

    if (
      value.npc.enemyId !== undefined &&
      typeof value.npc.enemyId !== 'string'
    ) {
      return null;
    }
  }

  const normalizedNpc =
    value.npc === undefined
      ? undefined
      : {
          name: value.npc.name as string,
          ...(value.npc.enemyId === undefined
            ? {}
            : { enemyId: value.npc.enemyId as string }),
        };

  return {
    ownerId: value.ownerId,
    ownerType: value.ownerType as NonNullable<
      GameState['tiles'][string]['claim']
    >['ownerType'],
    ownerName: value.ownerName,
    borderColor: value.borderColor,
    ...(normalizedNpc === undefined ? {} : { npc: normalizedNpc }),
  };
}

function normalizeEnemy(
  value: unknown,
  fallback?: GameState['enemies'][string],
): GameState['enemies'][string] | null {
  if (!isRecord(value)) {
    return fallback ? cloneEnemy(fallback) : null;
  }

  const coord = normalizeHexCoord(value.coord) ?? fallback?.coord ?? null;
  const statusEffects = normalizeStatusEffects(value.statusEffects);
  const enemyTypeId =
    normalizeEnemyTypeId(value.enemyTypeId) ??
    (value.enemyTypeId === undefined
      ? resolveLegacyEnemyTypeId(value.name)
      : (fallback?.enemyTypeId ?? null));
  if (!coord || typeof value.id !== 'string' || enemyTypeId === null) {
    return null;
  }

  return {
    id: value.id,
    enemyTypeId,
    ...(isStringArray(value.tags)
      ? {}
      : fallback?.tags === undefined
        ? {}
        : { tags: [...fallback.tags] as Enemy['tags'] }),
    ...(isStringArray(value.tags)
      ? { tags: [...value.tags] as Enemy['tags'] }
      : {}),
    name: normalizeConfiguredEnemyName(
      typeof value.name === 'string'
        ? value.name
        : (fallback?.name ?? value.id),
      enemyTypeId,
    ),
    coord,
    ...(isItemRarity(value.rarity)
      ? { rarity: value.rarity }
      : fallback?.rarity === undefined
        ? {}
        : { rarity: fallback.rarity }),
    tier: isFiniteNumber(value.tier) ? value.tier : (fallback?.tier ?? 1),
    ...(isFiniteNumber(value.baseMaxHp)
      ? { baseMaxHp: value.baseMaxHp }
      : fallback?.baseMaxHp === undefined
        ? {}
        : { baseMaxHp: fallback.baseMaxHp }),
    hp: isFiniteNumber(value.hp) ? value.hp : (fallback?.hp ?? 1),
    maxHp: isFiniteNumber(value.maxHp) ? value.maxHp : (fallback?.maxHp ?? 1),
    ...(isFiniteNumber(value.mana)
      ? { mana: value.mana }
      : fallback?.mana === undefined
        ? {}
        : { mana: fallback.mana }),
    ...(isFiniteNumber(value.maxMana)
      ? { maxMana: value.maxMana }
      : fallback?.maxMana === undefined
        ? {}
        : { maxMana: fallback.maxMana }),
    ...(isFiniteNumber(value.baseAttack)
      ? { baseAttack: value.baseAttack }
      : fallback?.baseAttack === undefined
        ? {}
        : { baseAttack: fallback.baseAttack }),
    attack: isFiniteNumber(value.attack)
      ? value.attack
      : (fallback?.attack ?? 0),
    ...(isFiniteNumber(value.baseDefense)
      ? { baseDefense: value.baseDefense }
      : fallback?.baseDefense === undefined
        ? {}
        : { baseDefense: fallback.baseDefense }),
    defense: isFiniteNumber(value.defense)
      ? value.defense
      : (fallback?.defense ?? 0),
    xp: isFiniteNumber(value.xp) ? value.xp : (fallback?.xp ?? 0),
    elite:
      typeof value.elite === 'boolean'
        ? value.elite
        : (fallback?.elite ?? false),
    ...(typeof value.worldBoss === 'boolean'
      ? { worldBoss: value.worldBoss }
      : fallback?.worldBoss === undefined
        ? {}
        : { worldBoss: fallback.worldBoss }),
    ...(typeof value.aggressive === 'boolean'
      ? { aggressive: value.aggressive }
      : fallback?.aggressive === undefined
        ? {}
        : { aggressive: fallback.aggressive }),
    ...(statusEffects == null ? {} : { statusEffects }),
    ...(isStringArray(value.abilityIds)
      ? { abilityIds: [...value.abilityIds] }
      : fallback?.abilityIds === undefined
        ? {}
        : { abilityIds: [...fallback.abilityIds] }),
  };
}

function normalizeConfiguredEnemyName(
  name: string,
  enemyTypeId: Enemy['enemyTypeId'],
) {
  if (enemyTypeId && name === `game.enemy.${enemyTypeId}.name`) {
    return getEnemyConfig(enemyTypeId)?.name ?? name;
  }

  return name;
}

function normalizePlayer(
  value: unknown,
  fallback: GameState['player'],
): GameState['player'] {
  if (!isRecord(value)) {
    return clonePlayer(fallback);
  }

  const coord = normalizeHexCoord(value.coord) ?? fallback.coord;
  const skills = normalizeSkills(value.skills, fallback.skills);
  const inventory = normalizeItemArray(value.inventory, fallback.inventory);
  const equipment = normalizeEquipment(value.equipment, fallback.equipment);
  const statusEffects = normalizeStatusEffects(value.statusEffects);

  return syncPlayerBaseStats({
    coord,
    level: isFiniteNumber(value.level) ? value.level : fallback.level,
    masteryLevel: isFiniteNumber(value.masteryLevel)
      ? value.masteryLevel
      : fallback.masteryLevel,
    xp: isFiniteNumber(value.xp) ? value.xp : fallback.xp,
    hp: isFiniteNumber(value.hp) ? value.hp : fallback.hp,
    baseMaxHp: isFiniteNumber(value.baseMaxHp)
      ? value.baseMaxHp
      : fallback.baseMaxHp,
    mana: isFiniteNumber(value.mana) ? value.mana : fallback.mana,
    baseMaxMana: isFiniteNumber(value.baseMaxMana)
      ? value.baseMaxMana
      : fallback.baseMaxMana,
    hunger: isFiniteNumber(value.hunger) ? value.hunger : fallback.hunger,
    ...(isFiniteNumber(value.thirst)
      ? { thirst: value.thirst }
      : fallback.thirst === undefined
        ? {}
        : { thirst: fallback.thirst }),
    baseAttack: isFiniteNumber(value.baseAttack)
      ? value.baseAttack
      : fallback.baseAttack,
    baseDefense: isFiniteNumber(value.baseDefense)
      ? value.baseDefense
      : fallback.baseDefense,
    skills,
    learnedRecipeIds: isStringArray(value.learnedRecipeIds)
      ? [...value.learnedRecipeIds]
      : [...fallback.learnedRecipeIds],
    favoriteRecipeIds: isStringArray(value.favoriteRecipeIds)
      ? [...value.favoriteRecipeIds]
      : [...fallback.favoriteRecipeIds],
    inventory,
    equipment,
    statusEffects: statusEffects ?? [...fallback.statusEffects],
    ...(isFiniteNumber(value.consumableCooldownEndsAt)
      ? { consumableCooldownEndsAt: value.consumableCooldownEndsAt }
      : fallback.consumableCooldownEndsAt === undefined
        ? {}
        : { consumableCooldownEndsAt: fallback.consumableCooldownEndsAt }),
  });
}

function normalizeSkills(
  value: unknown,
  fallback: GameState['player']['skills'],
): GameState['player']['skills'] {
  return Object.fromEntries(
    getSkillNames().map((skill) => {
      const progress = isRecord(value) ? value[skill] : undefined;
      const fallbackProgress = fallback[skill];

      if (
        isRecord(progress) &&
        isFiniteNumber(progress.level) &&
        isFiniteNumber(progress.xp)
      ) {
        return [skill, { level: progress.level, xp: progress.xp }] as const;
      }

      return [
        skill,
        { level: fallbackProgress.level, xp: fallbackProgress.xp },
      ] as const;
    }),
  ) as GameState['player']['skills'];
}

function normalizeEquipment(
  value: unknown,
  fallback: GameState['player']['equipment'],
): GameState['player']['equipment'] {
  if (!isRecord(value)) {
    return cloneEquipment(fallback);
  }

  const entries = Object.entries(value).flatMap(([key, item]) => {
    if (!isEquipmentSlot(key)) {
      return [];
    }

    const normalizedItem = normalizeItem(item);
    return normalizedItem ? [[key, normalizedItem] as const] : [];
  });

  if (entries.length === 0) {
    return cloneEquipment(fallback);
  }

  return Object.fromEntries(
    entries as Array<readonly [string, Item]>,
  ) as GameState['player']['equipment'];
}

function normalizeItemArray(value: unknown, fallback: Item[]) {
  if (!Array.isArray(value)) {
    return fallback.map((item) => ({ ...item }));
  }

  const items = value.flatMap((item) => {
    const normalizedItem = normalizeItem(item);
    return normalizedItem ? [normalizedItem] : [];
  });
  const consolidatedItems = consolidateInventory(items);

  return items.length > 0 || value.length === 0
    ? consolidatedItems
    : fallback.map((item) => ({ ...item }));
}

function cloneTile(tile: GameState['tiles'][string]) {
  return {
    ...tile,
    coord: { ...tile.coord },
    items: tile.items.map((item) => ({ ...item })),
    enemyIds: [...tile.enemyIds],
    ...(tile.claim === undefined
      ? {}
      : {
          claim: {
            ...tile.claim,
            ...(tile.claim.npc === undefined
              ? {}
              : { npc: { ...tile.claim.npc } }),
          },
        }),
  };
}

function cloneTiles(tiles: GameState['tiles']) {
  return Object.fromEntries(
    Object.entries(tiles).map(([key, tile]) => [key, cloneTile(tile)]),
  ) as GameState['tiles'];
}

function cloneEnemy(enemy: GameState['enemies'][string]) {
  return {
    ...enemy,
    coord: { ...enemy.coord },
    ...(enemy.tags === undefined ? {} : { tags: [...enemy.tags] }),
    ...(enemy.statusEffects === undefined
      ? {}
      : {
          statusEffects: enemy.statusEffects.map((effect) => ({
            ...effect,
            ...(effect.tags === undefined ? {} : { tags: [...effect.tags] }),
          })),
        }),
    ...(enemy.abilityIds === undefined
      ? {}
      : { abilityIds: [...enemy.abilityIds] }),
  };
}

function cloneEnemies(enemies: GameState['enemies']) {
  return Object.fromEntries(
    Object.entries(enemies).map(([key, enemy]) => [key, cloneEnemy(enemy)]),
  ) as GameState['enemies'];
}

function cloneEquipment(equipment: GameState['player']['equipment']) {
  return Object.fromEntries(
    Object.entries(equipment).map(([key, item]) => [key, { ...item }]),
  ) as GameState['player']['equipment'];
}

function clonePlayer(player: GameState['player']) {
  return {
    ...player,
    coord: { ...player.coord },
    skills: normalizeSkills(player.skills, player.skills),
    learnedRecipeIds: [...player.learnedRecipeIds],
    favoriteRecipeIds: [...player.favoriteRecipeIds],
    inventory: player.inventory.map((item) => ({ ...item })),
    equipment: cloneEquipment(player.equipment),
    statusEffects: player.statusEffects.map((effect) => ({
      ...effect,
      ...(effect.tags === undefined ? {} : { tags: [...effect.tags] }),
    })),
  };
}
