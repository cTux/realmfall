import { addLog } from './logs';
import { copyGameState } from './stateClone';
import type { GameState } from './types';

export function message(state: GameState, text: string): GameState {
  const next = copyGameState(state, { logs: true });
  addLog(next, 'system', text);
  return next;
}

export function cloneForWorldMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    combat: true,
    tiles: true,
    enemies: true,
    player: true,
  });
}

export function cloneForPlayerMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    player: true,
  });
}

export function cloneForPlayerCombatMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    combat: true,
    player: true,
  });
}

export function cloneForPlayerAndTileMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    tiles: true,
    player: true,
  });
}

export function cloneForWorldEventMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    combat: true,
    tiles: true,
    enemies: true,
  });
}

export function cloneForHomeMutation(state: GameState) {
  return copyGameState(state, {
    homeHex: true,
    logs: true,
    combat: true,
    tiles: true,
    enemies: true,
  });
}
