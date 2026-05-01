import type {
  ResolvedWorldTilePayload,
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
  TileResolutionCoord,
} from '@realmfall/common';
import { CancelablePromise } from 'easy-cancelable-promise';
import { describe, expect, it, vi } from 'vitest';
import {
  createWorldTileResolutionCoordinator,
  type WorldTileResolutionOverlayEntry,
} from './worldTileResolutionCoordinator';

const buildResolvedTilePayload = (
  coord: TileResolutionCoord,
): ResolvedWorldTilePayload => ({
  coord,
  tile: {
    coord,
    terrain: 'plains',
    items: [],
    enemyIds: [],
  },
  enemies: [],
});

describe('createWorldTileResolutionCoordinator', () => {
  it('requests only missing visible coords and marks overlay entries pending then revealed', async () => {
    const now = vi
      .fn<() => number>()
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_250);
    const overlaySnapshots: Array<
      Map<string, WorldTileResolutionOverlayEntry>
    > = [];
    const mergedPayloads: ResolvedWorldTilePayload[][] = [];
    const resolve = vi.fn(
      (
        request: ResolveWorldTilesRequest,
      ): CancelablePromise<ResolveWorldTilesResponse> =>
        CancelablePromise.resolve({
          requestId: request.requestId,
          tiles: request.coords.map((coord) => buildResolvedTilePayload(coord)),
        }),
    );
    const coordinator = createWorldTileResolutionCoordinator({
      now,
      onMergeResolvedTiles: (payloads) => mergedPayloads.push(payloads),
      onOverlayChange: (overlay) => overlaySnapshots.push(new Map(overlay)),
      source: { resolve, dispose: async () => undefined },
    });

    await coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 0, r: 0 },
      radius: 1,
      resolvedTiles: {
        '0,0': {
          coord: { q: 0, r: 0 },
          terrain: 'plains',
          items: [],
          enemyIds: [],
        },
      },
      seed: 'coord-batch-seed',
    });

    const request = resolve.mock.calls[0]?.[0];
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(request?.coords).toHaveLength(6);
    expect(mergedPayloads).toHaveLength(1);
    expect(overlaySnapshots).toHaveLength(2);
    expect(
      [...overlaySnapshots[0]!.values()].every(
        (entry) => entry.status === 'pending' && entry.requestedAt === 1_000,
      ),
    ).toBe(true);
    expect(
      [...coordinator.getOverlay().values()].every(
        (entry) =>
          entry.status === 'revealed' &&
          entry.requestedAt === 1_000 &&
          entry.resolvedAt === 1_250,
      ),
    ).toBe(true);
  });

  it('cancels the previous frontier request and ignores its late response', async () => {
    let resolveLate: ((value: ResolveWorldTilesResponse) => void) | null = null;
    let firstPromise: CancelablePromise<ResolveWorldTilesResponse> | null =
      null;
    let firstRequestCanceled = false;
    const source = {
      resolve: vi
        .fn<
          (
            request: ResolveWorldTilesRequest,
          ) => CancelablePromise<ResolveWorldTilesResponse>
        >()
        .mockImplementationOnce(() => {
          firstPromise = new CancelablePromise(
            (resolve, _reject, { onCancel }) => {
              onCancel(() => {
                firstRequestCanceled = true;
              });
              resolveLate = resolve;
            },
          );
          return firstPromise;
        })
        .mockImplementationOnce((request) =>
          CancelablePromise.resolve({
            requestId: request.requestId,
            tiles: request.coords.map((coord) =>
              buildResolvedTilePayload(coord),
            ),
          }),
        ),
      dispose: async () => undefined,
    };
    const onMergeResolvedTiles = vi.fn();
    const coordinator = createWorldTileResolutionCoordinator({
      now: () => 2_000,
      onMergeResolvedTiles,
      onOverlayChange: () => undefined,
      source,
    });

    const firstSync = coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 0, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'late-response-seed',
    });
    await coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 1, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'late-response-seed',
    });

    expect(firstRequestCanceled).toBe(true);
    if (!resolveLate) {
      throw new Error('Expected first request to expose a late resolver.');
    }
    const lateResolver = resolveLate as (
      value: ResolveWorldTilesResponse,
    ) => void;
    lateResolver({
      requestId: 'stale-request',
      tiles: [buildResolvedTilePayload({ q: 0, r: 0 })],
    });
    await firstSync;

    expect(firstPromise).not.toBeNull();
    expect(onMergeResolvedTiles).toHaveBeenCalledTimes(1);
    expect(source.resolve).toHaveBeenCalledTimes(2);
  });

  it('keeps the current frontier request alive when the visible ring is unchanged', async () => {
    let resolveCurrent: ((value: ResolveWorldTilesResponse) => void) | null =
      null;
    let currentRequestCanceled = false;
    const source = {
      resolve: vi
        .fn<
          (
            request: ResolveWorldTilesRequest,
          ) => CancelablePromise<ResolveWorldTilesResponse>
        >()
        .mockImplementationOnce(() => {
          const promise = new CancelablePromise<ResolveWorldTilesResponse>(
            (resolve, _reject, { onCancel }) => {
              onCancel(() => {
                currentRequestCanceled = true;
              });
              resolveCurrent = resolve;
            },
          );
          return promise;
        }),
      dispose: async () => undefined,
    };
    const onMergeResolvedTiles = vi.fn();
    const coordinator = createWorldTileResolutionCoordinator({
      now: () => 3_000,
      onMergeResolvedTiles,
      onOverlayChange: () => undefined,
      source,
    });

    const firstSync = coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 0, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'stable-frontier-seed',
    });
    const secondSync = coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 0, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'stable-frontier-seed',
    });

    expect(currentRequestCanceled).toBe(false);
    expect(source.resolve).toHaveBeenCalledTimes(1);
    if (!resolveCurrent) {
      throw new Error('Expected the in-flight request to expose a resolver.');
    }
    const [request] = source.resolve.mock.calls[0] ?? [];
    const currentResolver = resolveCurrent as (
      value: ResolveWorldTilesResponse,
    ) => void;
    currentResolver({
      requestId: request.requestId,
      tiles: request.coords.map((coord) => buildResolvedTilePayload(coord)),
    });

    await Promise.all([firstSync, secondSync]);

    expect(onMergeResolvedTiles).toHaveBeenCalledTimes(1);
  });

  it('clears stale pending entries before requesting a new visible frontier', async () => {
    const source = {
      resolve: vi
        .fn<
          (
            request: ResolveWorldTilesRequest,
          ) => CancelablePromise<ResolveWorldTilesResponse>
        >()
        .mockImplementationOnce(
          () =>
            new CancelablePromise<ResolveWorldTilesResponse>(() => {
              // Intentionally left unresolved so the next sync must cancel it.
            }),
        )
        .mockImplementationOnce((request) =>
          CancelablePromise.resolve({
            requestId: request.requestId,
            tiles: request.coords.map((coord) =>
              buildResolvedTilePayload(coord),
            ),
          }),
        ),
      dispose: async () => undefined,
    };
    const coordinator = createWorldTileResolutionCoordinator({
      now: () => 4_000,
      onMergeResolvedTiles: () => undefined,
      onOverlayChange: () => undefined,
      source,
    });

    void coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 0, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'frontier-shift-seed',
    });
    await coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 1, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'frontier-shift-seed',
    });

    const secondRequest = source.resolve.mock.calls[1]?.[0];
    expect(secondRequest?.coords).toHaveLength(7);
  });

  it('clears pending entries when the resolution source throws synchronously', async () => {
    const source = {
      resolve: vi.fn(() => {
        throw new Error('worker send failed');
      }),
      dispose: async () => undefined,
    };
    const coordinator = createWorldTileResolutionCoordinator({
      now: () => 5_000,
      onMergeResolvedTiles: () => undefined,
      onOverlayChange: () => undefined,
      source,
    });

    await expect(
      coordinator.syncVisibleCoords({
        bloodMoonActive: false,
        playerCoord: { q: 0, r: 0 },
        radius: 1,
        resolvedTiles: {},
        seed: 'sync-throw-seed',
      }),
    ).rejects.toThrow('worker send failed');

    expect(coordinator.getOverlay().size).toBe(0);

    await expect(
      coordinator.syncVisibleCoords({
        bloodMoonActive: false,
        playerCoord: { q: 0, r: 0 },
        radius: 1,
        resolvedTiles: {},
        seed: 'sync-throw-seed',
      }),
    ).rejects.toThrow('worker send failed');

    expect(source.resolve).toHaveBeenCalledTimes(2);
  });

  it('cleans up pending entries when the active response carries the wrong request id', async () => {
    const onMergeResolvedTiles = vi.fn();
    const source = {
      resolve: vi
        .fn<
          (
            request: ResolveWorldTilesRequest,
          ) => CancelablePromise<ResolveWorldTilesResponse>
        >()
        .mockImplementationOnce((request) =>
          CancelablePromise.resolve({
            requestId: 'wrong-request-id',
            tiles: request.coords.map((coord) =>
              buildResolvedTilePayload(coord),
            ),
          }),
        )
        .mockImplementationOnce((request) =>
          CancelablePromise.resolve({
            requestId: request.requestId,
            tiles: request.coords.map((coord) =>
              buildResolvedTilePayload(coord),
            ),
          }),
        ),
      dispose: async () => undefined,
    };
    const coordinator = createWorldTileResolutionCoordinator({
      now: () => 6_000,
      onMergeResolvedTiles,
      onOverlayChange: () => undefined,
      source,
    });

    await coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 0, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'wrong-response-id-seed',
    });

    expect(onMergeResolvedTiles).not.toHaveBeenCalled();
    expect(coordinator.getOverlay().size).toBe(0);

    await coordinator.syncVisibleCoords({
      bloodMoonActive: false,
      playerCoord: { q: 0, r: 0 },
      radius: 1,
      resolvedTiles: {},
      seed: 'wrong-response-id-seed',
    });

    expect(source.resolve).toHaveBeenCalledTimes(2);
    expect(onMergeResolvedTiles).toHaveBeenCalledTimes(1);
  });
});
