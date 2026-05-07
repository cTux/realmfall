import { createCombatActorState } from '../../../../../game/combat';
import type {
  CombatState,
  Enemy,
  PlayerStatusEffect,
} from '../../../../../game/stateTypes';
import type { CombatPartyMember } from '../../types';

export const WORLD_TIME_MS = 12_000;
export const COMBAT_COORD = { q: 1, r: 0 };

export const ENEMY_STATUS_EFFECTS: Pick<
  PlayerStatusEffect,
  'id' | 'value' | 'tickIntervalMs' | 'stacks'
>[] = [
  { id: 'power', value: 10, tickIntervalMs: 0, stacks: 0 },
  { id: 'guard', value: 15, tickIntervalMs: 0, stacks: 0 },
  { id: 'frenzy', value: 20, tickIntervalMs: 0, stacks: 0 },
];

export function createDefaultPlayerParty(worldTimeMs = WORLD_TIME_MS) {
  return [
    {
      id: 'player',
      name: 'Player',
      level: 7,
      hp: 42,
      maxHp: 42,
      mana: 18,
      maxMana: 18,
      attack: 12,
      actor: createCombatActorState(worldTimeMs, ['kick']),
      buffs: [],
      debuffs: [],
    },
  ] as CombatPartyMember[];
}

export function createDefaultEnemies() {
  return [
    {
      id: 'enemy-1',
      name: 'Wolf',
      coord: COMBAT_COORD,
      rarity: 'rare',
      tier: 2,
      hp: 30,
      maxHp: 34,
      mana: 100,
      maxMana: 100,
      attack: 10,
      defense: 8,
      xp: 64,
      elite: true,
      statusEffects: ENEMY_STATUS_EFFECTS,
      abilityIds: ['kick'],
    } as Enemy,
  ];
}

export function createDefaultCombat(worldTimeMs = WORLD_TIME_MS) {
  return {
    coord: COMBAT_COORD,
    enemyIds: ['enemy-1'],
    started: true,
    player: createCombatActorState(worldTimeMs, ['kick']),
    enemies: {
      'enemy-1': createCombatActorState(worldTimeMs, ['kick']),
    },
    enemyStateById: {
      'enemy-1': {},
    },
  } as CombatState;
}
