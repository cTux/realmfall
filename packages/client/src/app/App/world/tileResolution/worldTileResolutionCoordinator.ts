import type {
  ResolvedWorldTilePayload,
  ResolveWorldTilesRequest,
} from '@realmfall/common';
import type { CancelablePromise } from 'easy-cancelable-promise';
import { hexKey, hexesInRange, type HexCoord } from '../../../../game/hex';
import type { GameState } from '../../../../game/stateTypes';
import type { TileResolutionSource } from './TileResolutionSource';

export type WorldTileResolutionOverlayEntry =
  | { status: 'pending'; requestedAt: number }
  | { status: 'revealed'; requestedAt: number; resolvedAt: number };

type WorldTileResolutionOverlay = Map<string, WorldTileResolutionOverlayEntry>;

type VisibleWorldResolutionState = Pick<
  GameState,
  'bloodMoonActive' | 'radius' | 'seed'
> & {
  playerCoord: HexCoord;
  resolvedTiles: GameState['tiles'];
};

interface InFlightResolution {
  coords: HexCoord[];
  promise: CancelablePromise<unknown>;
  requestId: string;
}

export function createWorldTileResolutionCoordinator({
  now,
  onMergeResolvedTiles,
  onOverlayChange,
  source,
}: {
  now: () => number;
  onMergeResolvedTiles: (payloads: ResolvedWorldTilePayload[]) => void;
  onOverlayChange: (
    overlay: ReadonlyMap<string, WorldTileResolutionOverlayEntry>,
  ) => void;
  source: TileResolutionSource;
}) {
  let overlay: WorldTileResolutionOverlay = new Map();
  let inFlight: InFlightResolution | null = null;
  let requestSequence = 0;

  const emitOverlay = () => {
    onOverlayChange(new Map(overlay));
  };

  const cancelInFlight = (reason: string) => {
    const canceledRequest = inFlight;
    if (!canceledRequest) {
      return false;
    }

    inFlight = null;
    const overlayChanged = clearPendingForRequest(canceledRequest.coords);
    canceledRequest.promise.cancel(reason);
    return overlayChanged;
  };

  const pruneOverlayToVisibleKeys = (visibleKeys: Set<string>) => {
    let changed = false;
    const nextOverlay: WorldTileResolutionOverlay = new Map();

    for (const [key, entry] of overlay) {
      if (!visibleKeys.has(key)) {
        changed = true;
        continue;
      }

      nextOverlay.set(key, entry);
    }

    if (!changed) {
      return false;
    }

    overlay = nextOverlay;
    return true;
  };

  const markPending = (coords: HexCoord[], requestedAt: number) => {
    if (coords.length === 0) {
      return false;
    }

    let changed = false;
    const nextOverlay: WorldTileResolutionOverlay = new Map(overlay);
    for (const coord of coords) {
      const key = hexKey(coord);
      nextOverlay.set(key, {
        status: 'pending',
        requestedAt,
      });
      changed = true;
    }

    if (!changed) {
      return false;
    }

    overlay = nextOverlay;
    return true;
  };

  const markResolved = (
    payloads: ResolvedWorldTilePayload[],
    resolvedAt: number,
  ) => {
    if (payloads.length === 0) {
      return false;
    }

    let changed = false;
    const nextOverlay: WorldTileResolutionOverlay = new Map(overlay);
    for (const payload of payloads) {
      const key = hexKey(payload.coord);
      const previousEntry = overlay.get(key);
      nextOverlay.set(key, {
        status: 'revealed',
        requestedAt: previousEntry?.requestedAt ?? resolvedAt,
        resolvedAt,
      });
      changed = true;
    }

    if (!changed) {
      return false;
    }

    overlay = nextOverlay;
    return true;
  };

  const clearPendingForRequest = (coords: HexCoord[]) => {
    if (coords.length === 0) {
      return false;
    }

    let changed = false;
    const nextOverlay: WorldTileResolutionOverlay = new Map(overlay);
    for (const coord of coords) {
      const key = hexKey(coord);
      if (nextOverlay.get(key)?.status !== 'pending') {
        continue;
      }

      nextOverlay.delete(key);
      changed = true;
    }

    if (!changed) {
      return false;
    }

    overlay = nextOverlay;
    return true;
  };

  return {
    getOverlay() {
      return overlay;
    },

    async syncVisibleCoords({
      bloodMoonActive,
      playerCoord,
      radius,
      resolvedTiles,
      seed,
    }: VisibleWorldResolutionState) {
      const visibleCoords = hexesInRange(playerCoord, radius);
      const visibleKeys = new Set(visibleCoords.map((coord) => hexKey(coord)));
      let overlayChanged = pruneOverlayToVisibleKeys(visibleKeys);

      const collectMissingCoords = () =>
        visibleCoords.filter((coord) => {
          const key = hexKey(coord);
          return !(key in resolvedTiles) && !overlay.has(key);
        });

      if (
        inFlight?.coords.some((coord) => !visibleKeys.has(hexKey(coord))) ===
        true
      ) {
        overlayChanged =
          cancelInFlight('visible frontier changed') || overlayChanged;
      }

      let missingCoords = collectMissingCoords();
      if (missingCoords.length > 0 && inFlight) {
        overlayChanged =
          cancelInFlight('visible frontier changed') || overlayChanged;
        missingCoords = collectMissingCoords();
      }

      if (missingCoords.length === 0) {
        if (overlayChanged) {
          emitOverlay();
        }
        return;
      }

      const requestedAt = now();
      if (markPending(missingCoords, requestedAt) || overlayChanged) {
        emitOverlay();
      }

      requestSequence += 1;
      const requestId = `world-tile-resolution-${requestSequence}`;
      const request: ResolveWorldTilesRequest = {
        requestId,
        seed,
        bloodMoonActive,
        coords: missingCoords,
      };
      let requestPromise: ReturnType<TileResolutionSource['resolve']> | null =
        null;

      try {
        requestPromise = source.resolve(request);
        inFlight = {
          coords: missingCoords,
          promise: requestPromise,
          requestId,
        };
        const response = await requestPromise;
        if (inFlight?.requestId !== requestId) {
          return;
        }

        if (response.requestId !== requestId) {
          inFlight = null;
          if (clearPendingForRequest(missingCoords)) {
            emitOverlay();
          }
          return;
        }

        inFlight = null;
        onMergeResolvedTiles(response.tiles);
        if (markResolved(response.tiles, now())) {
          emitOverlay();
        }
      } catch (error) {
        const isCurrentRequest = inFlight?.requestId === requestId;
        if (isCurrentRequest) {
          inFlight = null;
        }

        if (
          (requestPromise === null || isCurrentRequest) &&
          clearPendingForRequest(missingCoords)
        ) {
          emitOverlay();
        }

        if (requestPromise?.status === 'canceled') {
          return;
        }

        if (requestPromise !== null && !isCurrentRequest) {
          return;
        }

        throw error;
      }
    },

    async dispose() {
      cancelInFlight('tile resolution disposed');
      await source.dispose();
    },
  };
}
