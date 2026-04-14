import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export const selectUi = (state: RootState) => state.ui;
export const selectWindows = (state: RootState) => state.ui.windows;
export const selectWindowShown = (state: RootState) => state.ui.windowShown;
export const selectLogFilters = (state: RootState) => state.ui.logFilters;
export const selectShowFilterMenu = (state: RootState) =>
  state.ui.showFilterMenu;
export const selectItemMenu = (state: RootState) => state.ui.itemMenu;

export const selectFilteredLogs = createSelector(
  [(state: RootState) => state.game.logs, selectLogFilters],
  (logs, logFilters) => logs.filter((entry) => logFilters[entry.kind]),
);
