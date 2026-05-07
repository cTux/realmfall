import type {
  ActiveDungeonRun,
  DungeonEntranceRecord,
  GameWorldState,
} from './dungeons/types';
import type { CombatState } from './combatTypes';
import type { Enemy } from './enemyTypes';
import type { LogEntry } from './logTypes';
import type { HexCoord } from './hex';
import type { Player } from './playerTypes';
import type { WorldFloatingTextEvent } from './worldTypes';
import type { Tile } from './worldTypes';

export interface GameState {
  seed: string;
  radius: number;
  surfaceWorldId: string;
  activeWorldId: string;
  worlds: Record<string, GameWorldState>;
  dungeonEntrances: Record<string, DungeonEntranceRecord>;
  activeDungeon: ActiveDungeonRun | null;
  homeHex: HexCoord;
  turn: number;
  worldTimeMs: number;
  dayPhase: 'day' | 'night';
  bloodMoonActive: boolean;
  bloodMoonCheckedTonight: boolean;
  bloodMoonCycle: number;
  harvestMoonActive: boolean;
  harvestMoonCheckedTonight: boolean;
  harvestMoonCycle: number;
  lastEarthshakeDay: number;
  gameOver: boolean;
  playerLevelUpVisualEndsAt?: number;
  logSequence: number;
  logs: LogEntry[];
  worldFloatingTextEvents: WorldFloatingTextEvent[];
  tiles: Record<string, Tile>;
  enemies: Record<string, Enemy>;
  player: Player;
  combat: CombatState | null;
}
