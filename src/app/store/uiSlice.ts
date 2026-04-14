import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LogKind } from '../../game/state';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  type WindowPositions,
  type WindowVisibilityState,
} from '../constants';
import type { ItemContextMenuState } from '../App/types';

export interface UiState {
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  logFilters: Record<LogKind, boolean>;
  showFilterMenu: boolean;
  itemMenu: ItemContextMenuState | null;
}

const initialState: UiState = {
  windows: DEFAULT_WINDOWS,
  windowShown: DEFAULT_WINDOW_VISIBILITY,
  logFilters: DEFAULT_LOG_FILTERS,
  showFilterMenu: false,
  itemMenu: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hydrateUi: (state, action: PayloadAction<Partial<UiState>>) => ({
      ...state,
      ...action.payload,
      windows: action.payload.windows ?? state.windows,
      windowShown: action.payload.windowShown ?? state.windowShown,
      logFilters: action.payload.logFilters ?? state.logFilters,
      showFilterMenu: action.payload.showFilterMenu ?? state.showFilterMenu,
      itemMenu:
        action.payload.itemMenu === undefined
          ? state.itemMenu
          : action.payload.itemMenu,
    }),
    moveWindow: (
      state,
      action: PayloadAction<{
        key: keyof WindowPositions;
        position: WindowPositions[keyof WindowPositions];
      }>,
    ) => {
      state.windows[action.payload.key] = action.payload.position;
    },
    setWindowVisibility: (
      state,
      action: PayloadAction<{
        key: keyof WindowVisibilityState;
        shown: boolean;
      }>,
    ) => {
      state.windowShown[action.payload.key] = action.payload.shown;
    },
    toggleDockWindow: (
      state,
      action: PayloadAction<keyof WindowVisibilityState>,
    ) => {
      const key = action.payload;
      state.windowShown[key] = !state.windowShown[key];
    },
    setLogFilters: (state, action: PayloadAction<Record<LogKind, boolean>>) => {
      state.logFilters = action.payload;
    },
    toggleLogFilter: (state, action: PayloadAction<LogKind>) => {
      const kind = action.payload;
      state.logFilters[kind] = !state.logFilters[kind];
    },
    setShowFilterMenu: (state, action: PayloadAction<boolean>) => {
      state.showFilterMenu = action.payload;
    },
    toggleFilterMenu: (state) => {
      state.showFilterMenu = !state.showFilterMenu;
    },
    openItemMenu: (state, action: PayloadAction<ItemContextMenuState>) => {
      state.itemMenu = action.payload;
    },
    closeItemMenu: (state) => {
      state.itemMenu = null;
    },
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
