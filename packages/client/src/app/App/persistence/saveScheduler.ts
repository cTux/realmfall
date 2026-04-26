import type { MutableRefObject } from 'react';
import {
  saveEncryptedState,
  type PersistedData,
} from '../../../persistence/storage';
import {
  buildPersistedSegments,
  buildPersistedSnapshot,
  getDirtySegments,
  serializeSegments,
  type DirtySaveSegments,
  type LatestSaveInputs,
  type SerializedSaveSegments,
} from './saveSegments';

export const AUTOSAVE_INTERVAL_MS = 5000;
const AUTOSAVE_DEBOUNCE_MS = AUTOSAVE_INTERVAL_MS;

function clearDebounceTimer(debounceTimerRef: MutableRefObject<number | null>) {
  if (debounceTimerRef.current !== null) {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }
}

export function clearDebounceSchedule(
  debounceDueAtRef: MutableRefObject<number | null>,
  debounceTimerRef: MutableRefObject<number | null>,
) {
  debounceDueAtRef.current = null;
  clearDebounceTimer(debounceTimerRef);
}

export function clearIdleSave(idleSaveRef: MutableRefObject<number | null>) {
  if (idleSaveRef.current === null) {
    return;
  }

  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(idleSaveRef.current);
  } else {
    window.clearTimeout(idleSaveRef.current);
  }

  idleSaveRef.current = null;
}

interface PersistSnapshotResult {
  error?: unknown;
  succeeded: boolean;
}

export function enqueuePersistSnapshot({
  dirtySegmentsRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
  savedDirtySegments,
  serialized,
  snapshot,
}: {
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
  savedDirtySegments: DirtySaveSegments;
  serialized: SerializedSaveSegments;
  snapshot: PersistedData;
}) {
  const queuedSave = saveQueueRef.current.then(async () => {
    saveInFlightRef.current = true;

    try {
      await saveEncryptedState(snapshot);
      lastSavedSerializedRef.current = mergeSavedSerializedSegments(
        lastSavedSerializedRef.current,
        serialized,
        savedDirtySegments,
      );

      return { succeeded: true } satisfies PersistSnapshotResult;
    } catch (error) {
      return { error, succeeded: false } satisfies PersistSnapshotResult;
    } finally {
      const pendingDirtySegments = { ...dirtySegmentsRef.current };
      dirtySegmentsRef.current = getDirtySegments(
        serializeSegments(
          buildPersistedSegments(latestInputsRef.current, pendingDirtySegments),
        ),
        lastSavedSerializedRef.current,
        pendingDirtySegments,
      );
      saveInFlightRef.current = false;
    }
  });

  saveQueueRef.current = queuedSave.then(() => undefined);

  return queuedSave;
}

function flushPendingSave({
  dirtySegmentsRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
}: {
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
}) {
  if (saveInFlightRef.current) return;
  if (!dirtySegmentsRef.current.game && !dirtySegmentsRef.current.ui) {
    return;
  }

  const candidateDirtySegments = { ...dirtySegmentsRef.current };
  const nextSegments = buildPersistedSegments(
    latestInputsRef.current,
    candidateDirtySegments,
  );
  const nextSerialized = serializeSegments(nextSegments);
  const nextDirtySegments = getDirtySegments(
    nextSerialized,
    lastSavedSerializedRef.current,
    candidateDirtySegments,
  );
  if (!nextDirtySegments.game && !nextDirtySegments.ui) {
    dirtySegmentsRef.current = nextDirtySegments;
    return;
  }

  void enqueuePersistSnapshot({
    dirtySegmentsRef,
    latestInputsRef,
    lastSavedSerializedRef,
    saveInFlightRef,
    saveQueueRef,
    savedDirtySegments: nextDirtySegments,
    serialized: nextSerialized,
    snapshot: buildPersistedSnapshot(nextSegments, nextDirtySegments),
  }).then((result) => {
    if (
      result.succeeded &&
      (dirtySegmentsRef.current.game || dirtySegmentsRef.current.ui)
    ) {
      flushPendingSave({
        dirtySegmentsRef,
        latestInputsRef,
        lastSavedSerializedRef,
        saveInFlightRef,
        saveQueueRef,
      });
    }
  });
}

function mergeSavedSerializedSegments(
  currentSerialized: SerializedSaveSegments,
  nextSerialized: SerializedSaveSegments,
  savedDirtySegments: DirtySaveSegments,
): SerializedSaveSegments {
  return {
    game: savedDirtySegments.game
      ? (nextSerialized.game ?? currentSerialized.game)
      : currentSerialized.game,
    ui: savedDirtySegments.ui
      ? (nextSerialized.ui ?? currentSerialized.ui)
      : currentSerialized.ui,
  };
}

export function scheduleIdleSave({
  dirtySegmentsRef,
  idleSaveRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
}: {
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  idleSaveRef: MutableRefObject<number | null>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
}) {
  if (idleSaveRef.current !== null) {
    return;
  }

  const runSave = () => {
    idleSaveRef.current = null;
    flushPendingSave({
      dirtySegmentsRef,
      latestInputsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
    });
  };

  idleSaveRef.current =
    typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(runSave, {
          timeout: AUTOSAVE_INTERVAL_MS,
        })
      : window.setTimeout(runSave, 0);
}

export function scheduleSave({
  debounceTimerRef,
  debounceDueAtRef,
  dirtySegmentsRef,
  idleSaveRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
}: {
  debounceTimerRef: MutableRefObject<number | null>;
  debounceDueAtRef: MutableRefObject<number | null>;
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  idleSaveRef: MutableRefObject<number | null>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
}) {
  if (!dirtySegmentsRef.current.game && !dirtySegmentsRef.current.ui) {
    clearDebounceSchedule(debounceDueAtRef, debounceTimerRef);
    clearIdleSave(idleSaveRef);
    return;
  }

  clearDebounceTimer(debounceTimerRef);
  debounceDueAtRef.current = Date.now() + AUTOSAVE_DEBOUNCE_MS;
  debounceTimerRef.current = window.setTimeout(() => {
    debounceDueAtRef.current = null;
    debounceTimerRef.current = null;
    scheduleIdleSave({
      dirtySegmentsRef,
      idleSaveRef,
      latestInputsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
    });
  }, AUTOSAVE_DEBOUNCE_MS);
}
