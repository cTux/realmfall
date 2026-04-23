import type { GameState, LogKind } from '../../../game/stateTypes';
import type { PersistedData } from '../../../persistence/storage';
import type { WindowPositions, WindowVisibilityState } from '../../constants';
import type { ActionBarSlots } from '../actionBar';

export type PersistedSaveSegments = {
  game: NonNullable<PersistedData['game']>;
  ui: NonNullable<PersistedData['ui']>;
};

export type SerializedSaveSegments = {
  game: string | null;
  ui: string | null;
};

export type DirtySaveSegments = {
  game: boolean;
  ui: boolean;
};

export type LatestSaveInputs = {
  actionBarSlots: ActionBarSlots;
  game: GameState;
  logFilters: Record<LogKind, boolean>;
  windowShown: WindowVisibilityState;
  windows: WindowPositions;
  worldTimeMs: number;
};

function buildPersistedGameSnapshot({
  game,
  worldTimeMs,
}: {
  game: GameState;
  worldTimeMs: number;
}) {
  return { ...game, worldTimeMs, logs: [] };
}

function buildPersistedUiSnapshot({
  actionBarSlots,
  logFilters,
  windowShown,
  windows,
}: {
  actionBarSlots: ActionBarSlots;
  logFilters: Record<LogKind, boolean>;
  windowShown: WindowVisibilityState;
  windows: WindowPositions;
}) {
  return { windows, windowShown, logFilters, actionBarSlots };
}

export function buildPersistedSnapshot(
  segments: PersistedSaveSegments,
): PersistedData {
  return {
    game: segments.game,
    ui: segments.ui,
  };
}

export function buildPersistedSegments(
  latestInputs: LatestSaveInputs,
): PersistedSaveSegments {
  return {
    game: buildPersistedGameSnapshot({
      game: latestInputs.game,
      worldTimeMs: latestInputs.worldTimeMs,
    }),
    ui: buildPersistedUiSnapshot({
      actionBarSlots: latestInputs.actionBarSlots,
      logFilters: latestInputs.logFilters,
      windowShown: latestInputs.windowShown,
      windows: latestInputs.windows,
    }),
  };
}

function serializeSegment(
  segment: PersistedSaveSegments[keyof PersistedSaveSegments],
) {
  return JSON.stringify(segment);
}

export function serializeSegments(
  segments: PersistedSaveSegments,
): SerializedSaveSegments {
  return {
    game: serializeSegment(segments.game),
    ui: serializeSegment(segments.ui),
  };
}

export function getDirtySegments(
  serialized: SerializedSaveSegments,
  lastSavedSerialized: SerializedSaveSegments,
): DirtySaveSegments {
  return {
    game: serialized.game !== lastSavedSerialized.game,
    ui: serialized.ui !== lastSavedSerialized.ui,
  };
}
