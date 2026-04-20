import {
  EQUIPMENT_SLOTS,
  Skill,
  type Enemy,
  type GameState,
  type Item,
  type LogKind,
} from '../game/state';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  type WindowPosition,
  type WindowPositions,
  type WindowVisibilityState,
} from './constants';

const ENEMY_TYPE_IDS = new Set([
  'gluttony',
  'raider',
  'marauder',
  'wolf',
  'boar',
  'stag',
  'spider',
]);
const SKILL_NAMES = Object.values(Skill);
const EQUIPMENT_SLOT_SET = new Set(EQUIPMENT_SLOTS);

type UnknownRecord = Record<string, unknown>;

export interface NormalizedPersistedUiState {
  actionBarSlots: Array<{ item: Item } | null>;
  logFilters: Record<LogKind, boolean>;
  windowShown: WindowVisibilityState;
  windows: WindowPositions;
}

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

export function normalizePersistedUiState(
  persistedUi: unknown,
): NormalizedPersistedUiState {
  if (!isRecord(persistedUi)) {
    return {
      actionBarSlots: Array.from({ length: 9 }, () => null),
      logFilters: DEFAULT_LOG_FILTERS,
      windowShown: DEFAULT_WINDOW_VISIBILITY,
      windows: DEFAULT_WINDOWS,
    };
  }

  return {
    actionBarSlots: normalizeActionBarSlots(persistedUi.actionBarSlots),
    logFilters: normalizeLogFilters(persistedUi.logFilters),
    windowShown: normalizeWindowVisibility(persistedUi.windowShown),
    windows: normalizeWindowPositions(persistedUi.windows),
  };
}

export function normalizeSavedUiItem(item: unknown) {
  return normalizeItem(item);
}

function normalizeActionBarSlots(slots: unknown) {
  if (!Array.isArray(slots)) {
    return Array.from({ length: 9 }, () => null);
  }

  return Array.from({ length: 9 }, (_, index) => {
    const slot = slots[index];
    if (!isRecord(slot)) {
      return null;
    }

    const item = normalizeItem(slot.item);
    return item ? { item } : null;
  });
}

function normalizeLogFilters(filters: unknown): Record<LogKind, boolean> {
  if (!isRecord(filters)) {
    return DEFAULT_LOG_FILTERS;
  }

  return {
    movement: filters.movement === false ? false : true,
    combat: filters.combat === false ? false : true,
    loot: filters.loot === false ? false : true,
    survival: filters.survival === false ? false : true,
    rumor: filters.rumor === false ? false : true,
    motd: filters.motd === false ? false : true,
    system: filters.system === false ? false : true,
  };
}

function normalizeWindowVisibility(
  value: unknown,
): WindowVisibilityState {
  if (!isRecord(value)) {
    return DEFAULT_WINDOW_VISIBILITY;
  }

  return {
    hero: value.hero === true,
    skills: value.skills === true,
    recipes: value.recipes === true,
    hexInfo: value.hexInfo === true,
    equipment: value.equipment === true,
    inventory: value.inventory === true,
    loot: value.loot === true,
    log: value.log === true,
    combat: value.combat === true,
    settings: value.settings === true,
  };
}

function normalizeWindowPositions(value: unknown): WindowPositions {
  if (!isRecord(value)) {
    return DEFAULT_WINDOWS;
  }

  return {
    hero: normalizeWindowPosition(value.hero, 'hero'),
    skills: normalizeWindowPosition(value.skills, 'skills'),
    recipes: normalizeWindowPosition(value.recipes, 'recipes'),
    hexInfo: normalizeWindowPosition(value.hexInfo, 'hexInfo'),
    equipment: normalizeWindowPosition(value.equipment, 'equipment'),
    inventory: normalizeWindowPosition(value.inventory, 'inventory'),
    loot: normalizeWindowPosition(value.loot, 'loot'),
    log: normalizeWindowPosition(value.log, 'log'),
    combat: normalizeWindowPosition(value.combat, 'combat'),
    settings: normalizeWindowPosition(value.settings, 'settings'),
  };
}

function normalizeWindowPosition(
  value: unknown,
  key: keyof WindowPositions,
): WindowPosition {
  const fallback = DEFAULT_WINDOWS[key];
  if (!isRecord(value)) {
    return { ...fallback };
  }

  const width =
    isFiniteNumber(value.width) && value.width > 0 ? value.width : fallback.width;
  const height =
    isFiniteNumber(value.height) && value.height > 0
      ? value.height
      : fallback.height;

  return {
    x: isFiniteNumber(value.x) ? value.x : fallback.x,
    y: isFiniteNumber(value.y) ? value.y : fallback.y,
    ...(width == null ? {} : { width }),
    ...(height == null ? {} : { height }),
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

  return Object.fromEntries(tiles as Array<readonly [string, GameState['tiles'][string]]>);
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

    if (value.npc.enemyId !== undefined && typeof value.npc.enemyId !== 'string') {
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
    ownerType:
      value.ownerType as NonNullable<
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
  if (
    !coord ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
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
    (value.enemyTypeId !== undefined && !isEnemyTypeId(value.enemyTypeId)) ||
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
    ...(value.enemyTypeId === undefined ? {} : { enemyTypeId: value.enemyTypeId }),
    ...(value.tags === undefined ? {} : { tags: [...value.tags] as Enemy['tags'] }),
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
    ...(value.abilityIds === undefined ? {} : { abilityIds: [...value.abilityIds] }),
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

  return {
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
  };
}

function normalizeSkills(value: unknown): GameState['player']['skills'] | null {
  if (!isRecord(value)) {
    return null;
  }

  const entries = SKILL_NAMES.map((skill) => {
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

  return Object.fromEntries(entries as Array<readonly [string, { level: number; xp: number }]>) as GameState['player']['skills'];
}

function normalizeEquipment(value: unknown): GameState['player']['equipment'] | null {
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

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.map((item) => normalizeItem(item));
  return items.every((item): item is Item => item !== null) ? items : null;
}

function normalizeItem(value: unknown): Item | null {
  if (!isRecord(value)) {
    return null;
  }

  const secondaryStats = normalizeSecondaryStats(value.secondaryStats);
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isFiniteNumber(value.quantity) ||
    !isFiniteNumber(value.tier) ||
    !isItemRarity(value.rarity) ||
    !isFiniteNumber(value.power) ||
    !isFiniteNumber(value.defense) ||
    !isFiniteNumber(value.maxHp) ||
    !isFiniteNumber(value.healing) ||
    secondaryStats === null
  ) {
    return null;
  }

  if (
    (value.itemKey !== undefined && typeof value.itemKey !== 'string') ||
    (value.tags !== undefined && !isStringArray(value.tags)) ||
    (value.recipeId !== undefined && typeof value.recipeId !== 'string') ||
    (value.locked !== undefined && typeof value.locked !== 'boolean') ||
    (value.slot !== undefined && !isEquipmentSlot(value.slot)) ||
    (value.icon !== undefined && typeof value.icon !== 'string') ||
    (value.hunger !== undefined && !isFiniteNumber(value.hunger)) ||
    (value.thirst !== undefined && !isFiniteNumber(value.thirst)) ||
    (value.secondaryStatCapacity !== undefined &&
      !isFiniteNumber(value.secondaryStatCapacity)) ||
    (value.grantedAbilityId !== undefined &&
      typeof value.grantedAbilityId !== 'string')
  ) {
    return null;
  }

  return {
    id: value.id,
    ...(value.itemKey === undefined ? {} : { itemKey: value.itemKey }),
    ...(value.tags === undefined ? {} : { tags: [...value.tags] as Item['tags'] }),
    ...(value.recipeId === undefined ? {} : { recipeId: value.recipeId }),
    ...(value.locked === undefined ? {} : { locked: value.locked }),
    ...(value.slot === undefined ? {} : { slot: value.slot }),
    ...(value.icon === undefined ? {} : { icon: value.icon }),
    name: value.name,
    quantity: value.quantity,
    tier: value.tier,
    rarity: value.rarity,
    power: value.power,
    defense: value.defense,
    maxHp: value.maxHp,
    healing: value.healing,
    hunger: value.hunger ?? 0,
    ...(value.thirst === undefined ? {} : { thirst: value.thirst }),
    ...(value.secondaryStatCapacity === undefined
      ? {}
      : { secondaryStatCapacity: value.secondaryStatCapacity }),
    ...(secondaryStats === undefined
      ? {}
      : { secondaryStats: secondaryStats as Item['secondaryStats'] }),
    ...(value.grantedAbilityId === undefined
      ? {}
      : { grantedAbilityId: value.grantedAbilityId }),
  };
}

function normalizeSecondaryStats(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const secondaryStats = value.map((stat) => {
    if (
      !isRecord(stat) ||
      typeof stat.key !== 'string' ||
      !isFiniteNumber(stat.value)
    ) {
      return null;
    }

    return { key: stat.key, value: stat.value };
  });

  return secondaryStats.every(
    (stat): stat is { key: string; value: number } => stat !== null,
  )
    ? secondaryStats
    : null;
}

function normalizeStatusEffects(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const statusEffects = value.map((effect) => {
    if (!isRecord(effect) || typeof effect.id !== 'string') {
      return null;
    }

    if (
      (effect.tags !== undefined && !isStringArray(effect.tags)) ||
      (effect.expiresAt !== undefined && !isFiniteNumber(effect.expiresAt)) ||
      (effect.tickIntervalMs !== undefined &&
        !isFiniteNumber(effect.tickIntervalMs)) ||
      (effect.lastProcessedAt !== undefined &&
        !isFiniteNumber(effect.lastProcessedAt)) ||
      (effect.stacks !== undefined && !isFiniteNumber(effect.stacks)) ||
      (effect.value !== undefined && !isFiniteNumber(effect.value))
    ) {
      return null;
    }

    return {
      id: effect.id,
      ...(effect.tags === undefined ? {} : { tags: [...effect.tags] }),
      ...(effect.expiresAt === undefined ? {} : { expiresAt: effect.expiresAt }),
      ...(effect.tickIntervalMs === undefined
        ? {}
        : { tickIntervalMs: effect.tickIntervalMs }),
      ...(effect.lastProcessedAt === undefined
        ? {}
        : { lastProcessedAt: effect.lastProcessedAt }),
      ...(effect.stacks === undefined ? {} : { stacks: effect.stacks }),
      ...(effect.value === undefined ? {} : { value: effect.value }),
    };
  });

  return statusEffects.every(
    (
      effect,
    ): effect is NonNullable<NonNullable<Enemy['statusEffects']>[number]> =>
      effect !== null,
  )
    ? statusEffects
    : null;
}

function normalizeCombatState(value: unknown) {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const coord = normalizeHexCoord(value.coord);
  const player = normalizeCombatActorState(value.player);
  const enemies = normalizeCombatActors(value.enemies);

  if (
    !coord ||
    !player ||
    !enemies ||
    !isStringArray(value.enemyIds) ||
    typeof value.started !== 'boolean'
  ) {
    return null;
  }

  return {
    coord,
    enemyIds: [...value.enemyIds],
    started: value.started,
    player,
    enemies,
  };
}

function normalizeCombatActors(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const entries = Object.entries(value).map(([key, actor]) => {
    const normalizedActor = normalizeCombatActorState(actor);
    return normalizedActor ? ([key, normalizedActor] as const) : null;
  });

  if (entries.some((entry) => entry === null)) {
    return null;
  }

  return Object.fromEntries(entries as Array<readonly [string, NonNullable<GameState['combat']>['player']]>);
}

function normalizeCombatActorState(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isStringArray(value.abilityIds) ||
    !isFiniteNumber(value.globalCooldownMs) ||
    !isFiniteNumber(value.globalCooldownEndsAt) ||
    !isCooldownMap(value.cooldownEndsAt)
  ) {
    return null;
  }

  if (
    (value.effectiveGlobalCooldownMs !== undefined &&
      !isFiniteNumber(value.effectiveGlobalCooldownMs)) ||
    (value.effectiveCooldownMs !== undefined &&
      !isCooldownMap(value.effectiveCooldownMs))
  ) {
    return null;
  }

  const casting = normalizeCombatCastState(value.casting);
  if (value.casting !== null && value.casting !== undefined && !casting) {
    return null;
  }

  return {
    abilityIds: [...value.abilityIds],
    globalCooldownMs: value.globalCooldownMs,
    ...(value.effectiveGlobalCooldownMs === undefined
      ? {}
      : { effectiveGlobalCooldownMs: value.effectiveGlobalCooldownMs }),
    globalCooldownEndsAt: value.globalCooldownEndsAt,
    cooldownEndsAt: { ...value.cooldownEndsAt },
    ...(value.effectiveCooldownMs === undefined
      ? {}
      : { effectiveCooldownMs: { ...value.effectiveCooldownMs } }),
    casting: casting ?? null,
  };
}

function normalizeCombatCastState(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.abilityId !== 'string' ||
    typeof value.targetId !== 'string' ||
    !isFiniteNumber(value.endsAt)
  ) {
    return null;
  }

  return {
    abilityId: value.abilityId,
    targetId: value.targetId,
    endsAt: value.endsAt,
  };
}

function normalizeHexCoord(value: unknown) {
  if (!isRecord(value) || !isFiniteNumber(value.q) || !isFiniteNumber(value.r)) {
    return null;
  }

  return { q: value.q, r: value.r };
}

function isDayPhase(value: unknown): value is GameState['dayPhase'] {
  return value === 'day' || value === 'night';
}

function isTerrain(value: unknown): value is GameState['tiles'][string]['terrain'] {
  return (
    value === 'plains' ||
    value === 'forest' ||
    value === 'rift' ||
    value === 'mountain' ||
    value === 'desert' ||
    value === 'swamp'
  );
}

function isStructure(
  value: unknown,
): value is NonNullable<GameState['tiles'][string]['structure']> {
  return (
    value === 'forge' ||
    value === 'camp' ||
    value === 'furnace' ||
    value === 'workshop' ||
    value === 'town' ||
    value === 'dungeon' ||
    value === 'herbs' ||
    value === 'tree' ||
    value === 'copper-ore' ||
    value === 'tin-ore' ||
    value === 'iron-ore' ||
    value === 'gold-ore' ||
    value === 'platinum-ore' ||
    value === 'coal-ore' ||
    value === 'pond' ||
    value === 'lake'
  );
}

function isEnemyTypeId(value: unknown): value is NonNullable<Enemy['enemyTypeId']> {
  return typeof value === 'string' && ENEMY_TYPE_IDS.has(value);
}

function isItemRarity(value: unknown): value is Item['rarity'] {
  return (
    value === 'common' ||
    value === 'uncommon' ||
    value === 'rare' ||
    value === 'epic' ||
    value === 'legendary'
  );
}

function isEquipmentSlot(value: unknown): value is NonNullable<Item['slot']> {
  return (
    typeof value === 'string' &&
    EQUIPMENT_SLOT_SET.has(value as NonNullable<Item['slot']>)
  );
}

function isCooldownMap(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => isFiniteNumber(entry))
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}
