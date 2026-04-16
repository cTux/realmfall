import { GAME_DAY_DURATION_MS, GAME_DAY_MINUTES } from '../game/config';
import {
  getItemCategory,
  getItemConfig,
  inferItemTags,
} from '../game/content/items';
import { EquipmentSlotId } from '../game/content/ids';
import { getEnemyConfig } from '../game/content/enemies';
import { getStatusEffectTags } from '../game/content/statusEffects';
import { getGatheringStructureConfig } from '../game/content/structures';
import { GAME_TAGS } from '../game/content/tags';
import {
  getRecipeBookRecipes,
  isGatheringStructure,
  makeGoldStack,
  type GameState,
  type Item,
  Skill,
  type SkillName,
} from '../game/state';
import { ItemId } from '../game/content/ids';
import { createCombatActorState } from '../game/combat';

export function normalizeLoadedGame(game: GameState): GameState {
  const { gold: legacyGoldValue, ...player } =
    game.player as GameState['player'] & {
      gold?: number;
    };
  const logs = (game.logs ?? []).map((entry, index) => ({
    ...entry,
    id: `l-${index + 1}`,
  }));

  const inventory = consolidateInventory(
    uniquifyItemIds(
      (game.player.inventory ?? [])
        .map(normalizeItem)
        .filter((item) => !isLegacyRecipeBookItem(item)),
    ),
  );
  const legacyGold = Math.max(0, Number(legacyGoldValue ?? 0));
  const hasInventoryGold = inventory.some(
    (item) =>
      item.itemKey === 'gold' &&
      (item.tags ?? []).includes(GAME_TAGS.item.resource),
  );
  if (legacyGold > 0 && !hasInventoryGold)
    mergeStackable(inventory, normalizeItem(makeGoldStack(legacyGold)));
  const equipment = Object.fromEntries(
    Object.entries(game.player.equipment ?? {}).map(([key, item]) => {
      const normalizedKey =
        key === 'relic' ? EquipmentSlotId.Offhand : key;
      return [normalizedKey, item ? normalizeItem(item) : item];
    }),
  );
  const tiles = Object.fromEntries(
    Object.entries(game.tiles ?? {}).map(([key, tile]) => [
      key,
      normalizeTile(tile),
    ]),
  );
  const enemies = Object.fromEntries(
    Object.entries(game.enemies ?? {}).map(([key, enemy]) => [
      key,
      normalizeEnemy(enemy),
    ]),
  );
  const homeHex = game.homeHex ?? { ...game.player.coord };
  const homeKey = `${homeHex.q},${homeHex.r}`;
  const existingHomeTile = tiles[homeKey];
  if (game.homeHex && existingHomeTile) {
    tiles[homeKey] = {
      ...existingHomeTile,
      items: [],
      structure: undefined,
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: [],
    };
  }

  return {
    ...game,
    homeHex,
    worldTimeMs: Math.max(0, Number(game.worldTimeMs ?? 0) || 0),
    dayPhase:
      game.dayPhase ??
      ((Math.max(0, Number(game.worldTimeMs ?? 0) || 0) /
        GAME_DAY_DURATION_MS) *
        GAME_DAY_MINUTES >=
        18 * 60 ||
      (Math.max(0, Number(game.worldTimeMs ?? 0) || 0) / GAME_DAY_DURATION_MS) *
        GAME_DAY_MINUTES <
        7 * 60
        ? 'night'
        : 'day'),
    bloodMoonActive: Boolean(game.bloodMoonActive),
    bloodMoonCheckedTonight: Boolean(game.bloodMoonCheckedTonight),
    bloodMoonCycle: Math.max(0, Number(game.bloodMoonCycle ?? 0) || 0),
    harvestMoonActive: Boolean(game.harvestMoonActive),
    harvestMoonCheckedTonight: Boolean(game.harvestMoonCheckedTonight),
    harvestMoonCycle: Math.max(0, Number(game.harvestMoonCycle ?? 0) || 0),
    lastEarthshakeDay: Number.isFinite(game.lastEarthshakeDay)
      ? Math.floor(game.lastEarthshakeDay)
      : -1,
    logSequence: Math.max(game.logSequence ?? 0, logs.length),
    logs,
    tiles,
    enemies,
    combat: game.combat
      ? {
          ...game.combat,
          enemyIds: game.combat.enemyIds ?? [],
          started: Boolean(game.combat.started),
          player: game.combat.player
            ? {
                ...game.combat.player,
                abilityIds: game.combat.player.abilityIds ?? ['kick'],
                globalCooldownMs: game.combat.player.globalCooldownMs ?? 1500,
                effectiveGlobalCooldownMs:
                  game.combat.player.effectiveGlobalCooldownMs ??
                  game.combat.player.globalCooldownMs ??
                  1500,
                globalCooldownEndsAt: Math.max(
                  0,
                  Number(game.combat.player.globalCooldownEndsAt ?? 0) || 0,
                ),
                cooldownEndsAt: game.combat.player.cooldownEndsAt ?? {},
                effectiveCooldownMs:
                  game.combat.player.effectiveCooldownMs ?? {},
                casting: game.combat.player.casting
                  ? { ...game.combat.player.casting }
                  : null,
              }
            : createCombatActorState(
                Math.max(0, Number(game.worldTimeMs ?? 0) || 0),
              ),
          enemies: Object.fromEntries(
            (game.combat.enemyIds ?? []).map((enemyId) => {
              const actor = game.combat?.enemies?.[enemyId];
              return [
                enemyId,
                actor
                  ? {
                      ...actor,
                      abilityIds: actor.abilityIds ?? ['kick'],
                      globalCooldownMs: actor.globalCooldownMs ?? 1500,
                      effectiveGlobalCooldownMs:
                        actor.effectiveGlobalCooldownMs ??
                        actor.globalCooldownMs ??
                        1500,
                      globalCooldownEndsAt: Math.max(
                        0,
                        Number(actor.globalCooldownEndsAt ?? 0) || 0,
                      ),
                      cooldownEndsAt: actor.cooldownEndsAt ?? {},
                      effectiveCooldownMs: actor.effectiveCooldownMs ?? {},
                      casting: actor.casting ? { ...actor.casting } : null,
                    }
                  : createCombatActorState(
                      Math.max(0, Number(game.worldTimeMs ?? 0) || 0),
                    ),
              ];
            }),
          ),
        }
      : null,
    player: {
      ...player,
      masteryLevel: Math.max(0, Number(game.player.masteryLevel ?? 0) || 0),
      mana: game.player.mana ?? 12,
      baseMaxMana: game.player.baseMaxMana ?? 12,
      hunger: Math.max(
        0,
        Math.min(100, Number(game.player.hunger ?? 100) || 100),
      ),
      thirst: Math.max(
        0,
        Math.min(
          100,
          Number(
            (
              game.player as GameState['player'] & {
                thirst?: number;
              }
            ).thirst ?? 100,
          ) || 100,
        ),
      ),
      skills: normalizeSkills(
        (
          game.player as GameState['player'] & {
            skills?: Partial<
              Record<SkillName, { level?: number; xp?: number }>
            >;
          }
        ).skills,
      ),
      learnedRecipeIds:
        game.player.learnedRecipeIds ??
        getRecipeBookRecipes().map((recipe) => recipe.id),
      statusEffects: (game.player.statusEffects ?? []).map((effect) => ({
        ...effect,
        tags: effect.tags ?? getStatusEffectTags(effect.id),
        expiresAt:
          effect.expiresAt == null
            ? undefined
            : Math.max(0, Number(effect.expiresAt) || 0),
        tickIntervalMs:
          effect.tickIntervalMs == null
            ? undefined
            : Math.max(1, Number(effect.tickIntervalMs) || 1_000),
        lastProcessedAt:
          effect.lastProcessedAt == null
            ? undefined
            : Math.max(0, Number(effect.lastProcessedAt) || 0),
      })),
      inventory,
      equipment,
    },
  };
}

function normalizeItem(item: Item): Item {
  const configured = getItemConfig(item);
  const normalizedName =
    configured?.name ??
    (item.name === 'Arcane Dust' ? 'Aether Dust' : item.name);
  return {
    ...item,
    itemKey: configured?.key ?? item.itemKey,
    locked: Boolean(item.locked),
    slot:
      item.slot === EquipmentSlotId.Relic
        ? EquipmentSlotId.Offhand
        : item.slot,
    tags: item.tags ?? configured?.tags ?? inferItemTags(item),
    name: normalizedName,
    quantity: item.quantity ?? 1,
    rarity: item.rarity ?? 'common',
    thirst: Math.max(
      0,
      Number((item as Item & { thirst?: number }).thirst ?? 0) || 0,
    ),
  };
}

function normalizeTile(tile: GameState['tiles'][string]) {
  const structureHp =
    isGatheringStructure(tile.structure) && tile.structureHp == null
      ? defaultStructureHp(tile.structure)
      : tile.structureHp;
  const structureMaxHp =
    isGatheringStructure(tile.structure) && tile.structureMaxHp == null
      ? defaultStructureHp(tile.structure)
      : tile.structureMaxHp;
  const legacyNpc = (
    tile.claim as {
      npcs?: { name: string; enemyId?: string }[];
    }
  )?.npcs?.[0];

  return {
    ...tile,
    structureHp,
    structureMaxHp,
    items: uniquifyItemIds((tile.items ?? []).map(normalizeItem)),
    claim: tile.claim
      ? {
          ...tile.claim,
          npc: tile.claim.npc ?? legacyNpc,
        }
      : undefined,
    enemyIds:
      tile.enemyIds ??
      (((tile as unknown as { enemyId?: string }).enemyId
        ? [(tile as unknown as { enemyId?: string }).enemyId as string]
        : []) as string[]),
  };
}

function normalizeEnemy(enemy: GameState['enemies'][string]) {
  const configured = getEnemyConfig(enemy.enemyTypeId ?? enemy.name);
  return {
    ...enemy,
    enemyTypeId: configured?.id ?? enemy.enemyTypeId,
    name: enemy.name || configured?.name,
    tags: enemy.tags ?? configured?.tags,
  };
}

function normalizeSkills(
  skills?: Partial<Record<SkillName, { level?: number; xp?: number }>>,
) {
  return {
    [Skill.Gathering]: normalizeSkill(skills?.[Skill.Gathering]),
    [Skill.Logging]: normalizeSkill(skills?.[Skill.Logging]),
    [Skill.Mining]: normalizeSkill(skills?.[Skill.Mining]),
    [Skill.Skinning]: normalizeSkill(skills?.[Skill.Skinning]),
    [Skill.Fishing]: normalizeSkill(skills?.[Skill.Fishing]),
    [Skill.Cooking]: normalizeSkill(skills?.[Skill.Cooking]),
    [Skill.Smelting]: normalizeSkill(skills?.[Skill.Smelting]),
    [Skill.Crafting]: normalizeSkill(skills?.[Skill.Crafting]),
  };
}

function normalizeSkill(skill?: { level?: number; xp?: number }) {
  return {
    level: Math.max(1, Number(skill?.level ?? 1) || 1),
    xp: Math.max(0, Number(skill?.xp ?? 0) || 0),
  };
}

function defaultStructureHp(
  structure: Extract<GameState['tiles'][string]['structure'], string>,
) {
  if (!isGatheringStructure(structure)) return undefined;

  try {
    return getGatheringStructureConfig(structure).gathering.maxHp;
  } catch {
    return undefined;
  }
}

function consolidateInventory(inventory: Item[]) {
  return inventory.reduce<Item[]>((merged, item) => {
    mergeStackable(merged, item);
    return merged;
  }, []);
}

function mergeStackable(inventory: Item[], item: Item) {
  if (!(item.tags ?? []).includes(GAME_TAGS.item.stackable)) {
    inventory.push(item);
    return;
  }

  const existing = inventory.find((entry) => isSameStackable(entry, item));
  if (existing) {
    existing.quantity += item.quantity;
    return;
  }

  inventory.push(item);
}

function isSameStackable(left: Item, right: Item) {
  return (
    (left.tags ?? []).includes(GAME_TAGS.item.stackable) &&
    getItemCategory(left) === getItemCategory(right) &&
    left.recipeId === right.recipeId &&
    sameStackIdentity(left, right) &&
    left.rarity === right.rarity &&
    left.healing === right.healing &&
    left.hunger === right.hunger
  );
}

function sameStackIdentity(left: Item, right: Item) {
  if (left.itemKey && right.itemKey) {
    return left.itemKey === right.itemKey;
  }

  return left.name === right.name;
}

function uniquifyItemIds(items: Item[]) {
  const usedIds = new Set<string>();

  return items.map((item) => {
    if (!usedIds.has(item.id)) {
      usedIds.add(item.id);
      return item;
    }

    let suffix = 2;
    let candidateId = `${item.id}-${suffix}`;
    while (usedIds.has(candidateId)) {
      suffix += 1;
      candidateId = `${item.id}-${suffix}`;
    }

    usedIds.add(candidateId);
    return {
      ...item,
      id: candidateId,
    };
  });
}

function isLegacyRecipeBookItem(item: Item) {
  return (
    item.itemKey === ItemId.RecipeBook ||
    item.name === 'Recipe Book' ||
    (item.tags ?? []).includes(GAME_TAGS.item.recipeBook)
  );
}
