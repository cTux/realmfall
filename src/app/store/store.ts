import { configureStore } from '@reduxjs/toolkit';
import { gameReducer } from './gameSlice';
import { uiReducer } from './uiSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // The game slice is a large plain-object tree. Walking all of it on every
      // dispatch adds noticeable dev-only overhead without catching issues that
      // are likely in this app path, so keep action checks but skip full-state
      // serializability traversal.
      serializableCheck: {
        ignoreState: true,
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
