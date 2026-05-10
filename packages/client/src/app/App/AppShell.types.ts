import type {
  GameState,
  HexCoord,
  WorldKind,
} from '@realmfall/core/game/stateTypes';

export interface AppShellVoicePlaybackState {
  combat: GameState['combat'];
  logSequence: GameState['logSequence'];
  logs: GameState['logs'];
  player: {
    hp: GameState['player']['hp'];
    statusEffects: GameState['player']['statusEffects'];
  };
}

export interface AppShellHomeIndicatorState {
  currentWorldKind: WorldKind;
  dungeonExitHex: HexCoord | null;
  homeHex: HexCoord;
  playerCoord: HexCoord;
  radius: number;
  visibleRadius: number;
}

export interface AppShellState {
  homeIndicator: AppShellHomeIndicatorState;
  voicePlayback: AppShellVoicePlaybackState;
}
