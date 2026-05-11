import type { GameState } from '@realmfall/core/game/stateTypes';
import type { AppWindowsProps } from './AppWindows.types';
import type { AppControllers } from './useAppControllers';

type AppGameView = ReturnType<typeof import('./useAppGameView').useAppGameView>;
type AppSettingsActions = ReturnType<
  typeof import('./hooks/useAppSettingsActions').useAppSettingsActions
>;
type WindowTransitions = ReturnType<
  typeof import('./useWindowTransitions').useWindowTransitions
>;

export type AppWindowPlayerState = Pick<
  GameState['player'],
  | 'coord'
  | 'equipment'
  | 'hunger'
  | 'inventory'
  | 'learnedRecipeIds'
  | 'level'
  | 'mana'
  | 'thirst'
>;

export interface AppWindowRuntimeGameSnapshot {
  combat: GameState['combat'];
  homeHex: GameState['homeHex'];
  player: AppWindowPlayerState;
}

export interface UseAppWindowRuntimeArgs {
  appReady: boolean;
  controllerActions: AppControllers['actions'];
  controllerMutators: AppControllers['mutators'];
  controllerState: AppControllers['state'];
  gameSnapshot: AppWindowRuntimeGameSnapshot;
  gameView: AppGameView;
  interactLabel: string | null;
  onInteract: () => void;
  settingsActions: AppSettingsActions;
  tooltipPositionRef: AppWindowsProps['layout']['tooltipPositionRef'];
  windowTransitions: WindowTransitions;
}
