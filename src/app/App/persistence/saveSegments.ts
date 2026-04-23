import type { GameState, LogKind } from '../../../game/stateTypes';
import type { PersistedData } from '../../../persistence/storage';
import type { WindowPositions, WindowVisibilityState } from '../../constants';
import type { ActionBarSlots } from '../actionBar';

export type PersistedSaveSegments = {
  game: NonNullable<PersistedData['game']>;
  ui: NonNullable<PersistedData['ui']>;
};

export type PartialPersistedSaveSegments = Partial<PersistedSaveSegments>;

export type SerializedSaveSegments = {
  game: string | null;
  ui: string | null;
};

export type DirtySaveSegments = {
  game: boolean;
  ui: boolean;
};

const ALL_SAVE_SEGMENTS = {
  game: true,
  ui: true,
} satisfies DirtySaveSegments;

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
  segments: PartialPersistedSaveSegments,
  dirtySegments: DirtySaveSegments = ALL_SAVE_SEGMENTS,
): PersistedData {
  const snapshot: PersistedData = {};

  if (dirtySegments.game && segments.game !== undefined) {
    snapshot.game = segments.game;
  }

  if (dirtySegments.ui && segments.ui !== undefined) {
    snapshot.ui = segments.ui;
  }

  return snapshot;
}

export function buildPersistedSegments(
  latestInputs: LatestSaveInputs,
  dirtySegments: DirtySaveSegments = ALL_SAVE_SEGMENTS,
): PartialPersistedSaveSegments {
  const segments: PartialPersistedSaveSegments = {};

  if (dirtySegments.game) {
    segments.game = buildPersistedGameSnapshot({
      game: latestInputs.game,
      worldTimeMs: latestInputs.worldTimeMs,
    });
  }

  if (dirtySegments.ui) {
    segments.ui = buildPersistedUiSnapshot({
      actionBarSlots: latestInputs.actionBarSlots,
      logFilters: latestInputs.logFilters,
      windowShown: latestInputs.windowShown,
      windows: latestInputs.windows,
    });
  }

  return segments;
}

function serializeSegment(
  segment: PersistedSaveSegments[keyof PersistedSaveSegments],
) {
  return JSON.stringify(segment);
}

export function serializeSegments(
  segments: PartialPersistedSaveSegments,
): SerializedSaveSegments {
  return {
    game: segments.game === undefined ? null : serializeSegment(segments.game),
    ui: segments.ui === undefined ? null : serializeSegment(segments.ui),
  };
}

export function getDirtySegments(
  serialized: SerializedSaveSegments,
  lastSavedSerialized: SerializedSaveSegments,
  candidateSegments: DirtySaveSegments = ALL_SAVE_SEGMENTS,
): DirtySaveSegments {
  return {
    game:
      candidateSegments.game && serialized.game !== lastSavedSerialized.game,
    ui: candidateSegments.ui && serialized.ui !== lastSavedSerialized.ui,
  };
}
