export * from './core';
export * from './i18n';
export { createGame } from './game/stateFactory';
export * as game from './game';
export type { CombatState, Enemy, GameState, Item, Player } from './game/types';
export type { HexCoord as RuntimeHexCoord } from './game/hex';
export type { Tile as TileState } from './game/types';
