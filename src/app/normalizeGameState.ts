import { syncPlayerBaseStats } from '../game/balance';
import type { Enemy, GameState, Item } from '../game/stateTypes';
import { normalizeCombatState } from './normalizeCombat';
import {
  normalizeItem,
  normalizeItems,
  normalizeStatusEffects,
} from './normalizeItems';
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

  const homeHex = normalizeHexCoord(game.homeHex);
  const player = normalizePlayer(game.player);
  if (!homeHex || !player) {
    return null;
  }

  const combat = normalizeCombatState(game.combat);
  if (game.combat !== null && !combat) {
    return null;
  }

  const tiles = normalizeTiles(game.tiles);
  const enemies = normalizeEnemies(game.enemies);
  if (!tiles || !enemies) {
    return null;
  }

  if (
    typeof game.seed !== 'string' ||
    !isFiniteNumber(game.radius) ||
    !isFiniteNumber(game.turn) ||
    !isFiniteNumber(game.worldTimeMs) ||
    !isDayPhase(game.dayPhase) ||
    typeof game.bloodMoonActive !== 'boolean' ||
    typeof game.bloodMoonCheckedTonight !== 'boolean' ||
    !isFiniteNumber(game.bloodMoonCycle) ||
    typeof game.harvestMoonActive !== 'boolean' ||
    typeof game.harvestMoonCheckedTonight !== 'boolean' ||
    !isFiniteNumber(game.harvestMoonCycle) ||
    !isFiniteNumber(game.lastEarthshakeDay) ||
    typeof game.gameOver !== 'boolean' ||
    !isFiniteNumber(game.logSequence)
  ) {
    return null;
  }

  return {
    seed: game.seed,
    radius: game.radius,
    homeHex,
    turn: game.turn,
    worldTimeMs: game.worldTimeMs,
    dayPhase: game.dayPhase,
    bloodMoonActive: game.bloodMoonActive,
    bloodMoonCheckedTonight: game.bloodMoonCheckedTonight,
    bloodMoonCycle: game.bloodMoonCycle,
    harvestMoonActive: game.harvestMoonActive,
    harvestMoonCheckedTonight: game.harvestMoonCheckedTonight,
    harvestMoonCycle: game.harvestMoonCycle,
    lastEarthshakeDay: game.lastEarthshakeDay,
    gameOver: game.gameOver,
    logSequence: game.logSequence,
    logs: [],
    tiles,
    enemies,
    player,
    combat,
  };
}

function normalizeTiles(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const tiles = Object.entries(value).map(([key, tile]) => {
    const normalizedTile = normalizeTile(tile);
    return normalizedTile ? ([key, normalizedTile] as const) : null;
  });

  if (tiles.some((tile) => tile === null)) {
    return null;
  }

  return Object.fromEntries(
    tiles as Array<readonly [string, GameState['tiles'][string]]>,
  );
}

function normalizeEnemies(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const enemies = Object.entries(value).map(([key, enemy]) => {
    const normalizedEnemy = normalizeEnemy(enemy);
    return normalizedEnemy ? ([key, normalizedEnemy] as const) : null;
  });

  if (enemies.some((enemy) => enemy === null)) {
    return null;
  }

  return Object.fromEntries(
    enemies as Array<readonly [string, GameState['enemies'][string]]>,
  );
}

function normalizeTile(value: unknown): GameState['tiles'][string] | null {
  if (!isRecord(value)) {
    return null;
  }

  const coord = normalizeHexCoord(value.coord);
  const items = normalizeItems(value.items);
  const claim = normalizeTileClaim(value.claim);
  if (
    !coord ||
    !isTerrain(value.terrain) ||
    !items ||
    !isStringArray(value.enemyIds) ||
    (value.structure !== undefined && !isStructure(value.structure))
  ) {
    return null;
  }

  if (
    (value.structureHp !== undefined && !isFiniteNumber(value.structureHp)) ||
    (value.structureMaxHp !== undefined &&
      !isFiniteNumber(value.structureMaxHp))
  ) {
    return null;
  }

  return {
    coord,
    terrain: value.terrain,
    ...(value.structure === undefined ? {} : { structure: value.structure }),
    ...(value.structureHp === undefined
      ? {}
      : { structureHp: value.structureHp }),
    ...(value.structureMaxHp === undefined
      ? {}
      : { structureMaxHp: value.structureMaxHp }),
    items,
    enemyIds: [...value.enemyIds],
    ...(claim == null ? {} : { claim }),
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

function normalizeEnemy(value: unknown): GameState['enemies'][string] | null {
  if (!isRecord(value)) {
    return null;
  }

  const coord = normalizeHexCoord(value.coord);
  const statusEffects = normalizeStatusEffects(value.statusEffects);
  const enemyTypeId = normalizeEnemyTypeId(value.enemyTypeId, value.name);
  if (
    !coord ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    enemyTypeId === null ||
    !isFiniteNumber(value.tier) ||
    !isFiniteNumber(value.hp) ||
    !isFiniteNumber(value.maxHp) ||
    !isFiniteNumber(value.attack) ||
    !isFiniteNumber(value.defense) ||
    !isFiniteNumber(value.xp) ||
    typeof value.elite !== 'boolean'
  ) {
    return null;
  }

  if (
    (value.tags !== undefined && !isStringArray(value.tags)) ||
    (value.rarity !== undefined && !isItemRarity(value.rarity)) ||
    (value.baseMaxHp !== undefined && !isFiniteNumber(value.baseMaxHp)) ||
    (value.mana !== undefined && !isFiniteNumber(value.mana)) ||
    (value.maxMana !== undefined && !isFiniteNumber(value.maxMana)) ||
    (value.baseAttack !== undefined && !isFiniteNumber(value.baseAttack)) ||
    (value.baseDefense !== undefined && !isFiniteNumber(value.baseDefense)) ||
    (value.worldBoss !== undefined && typeof value.worldBoss !== 'boolean') ||
    (value.aggressive !== undefined && typeof value.aggressive !== 'boolean') ||
    (value.abilityIds !== undefined && !isStringArray(value.abilityIds)) ||
    statusEffects === null
  ) {
    return null;
  }

  return {
    id: value.id,
    enemyTypeId,
    ...(value.tags === undefined
      ? {}
      : { tags: [...value.tags] as Enemy['tags'] }),
    name: value.name,
    coord,
    ...(value.rarity === undefined ? {} : { rarity: value.rarity }),
    tier: value.tier,
    ...(value.baseMaxHp === undefined ? {} : { baseMaxHp: value.baseMaxHp }),
    hp: value.hp,
    maxHp: value.maxHp,
    ...(value.mana === undefined ? {} : { mana: value.mana }),
    ...(value.maxMana === undefined ? {} : { maxMana: value.maxMana }),
    ...(value.baseAttack === undefined ? {} : { baseAttack: value.baseAttack }),
    attack: value.attack,
    ...(value.baseDefense === undefined
      ? {}
      : { baseDefense: value.baseDefense }),
    defense: value.defense,
    xp: value.xp,
    elite: value.elite,
    ...(value.worldBoss === undefined ? {} : { worldBoss: value.worldBoss }),
    ...(value.aggressive === undefined ? {} : { aggressive: value.aggressive }),
    ...(statusEffects === undefined ? {} : { statusEffects }),
    ...(value.abilityIds === undefined
      ? {}
      : { abilityIds: [...value.abilityIds] }),
  };
}

function normalizePlayer(value: unknown): GameState['player'] | null {
  if (!isRecord(value)) {
    return null;
  }

  const coord = normalizeHexCoord(value.coord);
  const skills = normalizeSkills(value.skills);
  const inventory = normalizeItems(value.inventory);
  const equipment = normalizeEquipment(value.equipment);
  const statusEffects = normalizeStatusEffects(value.statusEffects);

  if (
    !coord ||
    !skills ||
    !inventory ||
    !equipment ||
    statusEffects === null ||
    !isFiniteNumber(value.level) ||
    !isFiniteNumber(value.masteryLevel) ||
    !isFiniteNumber(value.xp) ||
    !isFiniteNumber(value.hp) ||
    !isFiniteNumber(value.baseMaxHp) ||
    !isFiniteNumber(value.mana) ||
    !isFiniteNumber(value.baseMaxMana) ||
    !isFiniteNumber(value.hunger) ||
    !isFiniteNumber(value.baseAttack) ||
    !isFiniteNumber(value.baseDefense) ||
    !isStringArray(value.learnedRecipeIds)
  ) {
    return null;
  }

  if (
    (value.thirst !== undefined && !isFiniteNumber(value.thirst)) ||
    (value.consumableCooldownEndsAt !== undefined &&
      !isFiniteNumber(value.consumableCooldownEndsAt))
  ) {
    return null;
  }

  return syncPlayerBaseStats({
    coord,
    level: value.level,
    masteryLevel: value.masteryLevel,
    xp: value.xp,
    hp: value.hp,
    baseMaxHp: value.baseMaxHp,
    mana: value.mana,
    baseMaxMana: value.baseMaxMana,
    hunger: value.hunger,
    ...(value.thirst === undefined ? {} : { thirst: value.thirst }),
    baseAttack: value.baseAttack,
    baseDefense: value.baseDefense,
    skills,
    learnedRecipeIds: [...value.learnedRecipeIds],
    inventory,
    equipment,
    statusEffects: statusEffects ?? [],
    ...(value.consumableCooldownEndsAt === undefined
      ? {}
      : { consumableCooldownEndsAt: value.consumableCooldownEndsAt }),
  });
}

function normalizeSkills(value: unknown): GameState['player']['skills'] | null {
  if (!isRecord(value)) {
    return null;
  }

  const entries = getSkillNames().map((skill) => {
    const progress = value[skill];
    if (
      !isRecord(progress) ||
      !isFiniteNumber(progress.level) ||
      !isFiniteNumber(progress.xp)
    ) {
      return null;
    }

    return [skill, { level: progress.level, xp: progress.xp }] as const;
  });

  if (entries.some((entry) => entry === null)) {
    return null;
  }

  return Object.fromEntries(
    entries as Array<readonly [string, { level: number; xp: number }]>,
  ) as GameState['player']['skills'];
}

function normalizeEquipment(
  value: unknown,
): GameState['player']['equipment'] | null {
  if (!isRecord(value)) {
    return null;
  }

  const entries = Object.entries(value).map(([key, item]) => {
    if (!isEquipmentSlot(key)) {
      return null;
    }

    const normalizedItem = normalizeItem(item);
    return normalizedItem ? ([key, normalizedItem] as const) : null;
  });

  if (entries.some((entry) => entry === null)) {
    return null;
  }

  return Object.fromEntries(
    entries as Array<readonly [string, Item]>,
  ) as GameState['player']['equipment'];
}
