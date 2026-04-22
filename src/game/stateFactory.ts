import { WORLD_RADIUS, STARTING_RECIPE_IDS } from './config';
import { ItemId } from './content/ids';
import { getPlayerBaseStatsForLevel } from './balance';
import { createFreshLogsAtTime } from './logs';
import {
  makeConsumable,
  makeStarterArmor,
  makeStarterWeapon,
} from './inventory';
import { makeStartingSkills } from './progression';
import { cacheSafeStart } from './world';
import type { GameState } from './types';

export function createGame(
  radius = WORLD_RADIUS,
  seed = `world-${Date.now()}`,
): GameState {
  const baseStats = getPlayerBaseStatsForLevel(1);
  const state: GameState = {
    seed,
    radius,
    homeHex: { q: 0, r: 0 },
    turn: 0,
    worldTimeMs: 0,
    dayPhase: 'night',
    bloodMoonActive: false,
    bloodMoonCheckedTonight: false,
    bloodMoonCycle: 0,
    harvestMoonActive: false,
    harvestMoonCheckedTonight: false,
    harvestMoonCycle: 0,
    lastEarthshakeDay: -1,
    gameOver: false,
    logSequence: 3,
    logs: createFreshLogsAtTime(seed, 0),
    tiles: {},
    enemies: {},
    combat: null,
    player: {
      coord: { q: 0, r: 0 },
      level: 1,
      masteryLevel: 0,
      xp: 0,
      hp: baseStats.maxHp,
      baseMaxHp: baseStats.maxHp,
      mana: 12,
      baseMaxMana: 12,
      hunger: 100,
      thirst: 100,
      baseAttack: baseStats.attack,
      baseDefense: baseStats.defense,
      skills: makeStartingSkills(),
      learnedRecipeIds: [...STARTING_RECIPE_IDS],
      statusEffects: [],
      consumableCooldownEndsAt: 0,
      inventory: [
        makeStarterWeapon(),
        makeStarterArmor('chest', ItemId.SettlerVest, 1, 1),
        makeConsumable('starter-ration', ItemId.TrailRation, 1, 10, 15, 2),
      ],
      equipment: {},
    },
  };

  cacheSafeStart(state);
  return state;
}
