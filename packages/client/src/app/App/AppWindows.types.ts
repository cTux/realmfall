import type { MutableRefObject } from 'react';
import type { TooltipPosition } from '@realmfall/ui';
import type { WindowPositions, WindowVisibilityState } from '../constants';
import type { AppWindowsActions } from './AppWindows.actionTypes';
import type { AppWindowsViewState } from './AppWindows.viewTypes';

export interface AppWindowsProps {
  layout: AppWindowsLayout;
  views: AppWindowsViewState;
  actions: AppWindowsActions;
}

export interface AppWindowsLayout {
  appReady: boolean;
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  keepLootWindowMounted: boolean;
  keepCombatWindowMounted: boolean;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
}
export type { AppWindowsActions } from './AppWindows.actionTypes';
export type {
  AppWindowsViewState,
  CombatViewState,
  HexViewState,
  HeroViewState,
  InventoryViewState,
  LogsViewState,
  PlayerViewState,
  RecipesViewState,
  SettingsViewState,
} from './AppWindows.viewTypes';
