import type { ResolvedWorldTilePayload } from '@realmfall/common';
import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { hexKey, hexesInRange, type HexCoord } from '../../../../game/hex';
import {
  getActiveWorld,
  replaceWorldCollections,
} from '../../../../game/dungeons/worldState';
import type { GameState } from '../../../../game/stateTypes';
import type { VisibleWorldTile } from '../../../../ui/world/visibleWorldTiles';
import type { WorldTileResolutionOverlayEntry } from './worldTileResolutionCoordinator';

export type VisibleWorldResolutionState = Pick<
  GameState,
  'bloodMoonActive' | 'radius' | 'seed'
> & {
  playerCoord: HexCoord;
  resolvedTiles: GameState['tiles'];
};

export interface TileResolutionCoordinator {
  dispose(): Promise<void>;
  syncVisibleCoords(state: VisibleWorldResolutionState): Promise<void>;
}

interface VisibleWorldTileBuildArgs {
  overlay: ReadonlyMap<string, WorldTileResolutionOverlayEntry>;
  playerCoord: HexCoord;
  radius: GameState['radius'];
  resolvedTiles: GameState['tiles'];
}

interface RebuildVisibleWorldTilesArgs extends Omit<
  VisibleWorldTileBuildArgs,
  'overlay'
> {
  overlay?: ReadonlyMap<string, WorldTileResolutionOverlayEntry>;
}

type BuildVisibleWorldTiles = (
  args: VisibleWorldTileBuildArgs,
) => VisibleWorldTile[];

type ReuseVisibleTiles = (
  previousVisibleTiles: VisibleWorldTile[],
  nextVisibleTiles: VisibleWorldTile[],
) => VisibleWorldTile[];

type HydrateResolvedWorldTilePayload = (payload: ResolvedWorldTilePayload) => {
  coord: ResolvedWorldTilePayload['coord'];
  enemies: GameState['enemies'][string][];
  tile: GameState['tiles'][string];
};

export interface VisibleTilesUpdate {
  nextVisibleTiles: VisibleWorldTile[];
  playerCoord: HexCoord;
  previousPlayerCoord: HexCoord;
  previousVisibleTiles: VisibleWorldTile[];
}

interface UseWorldTileResolutionLifecycleArgs {
  enabled: boolean;
  game: Pick<
    GameState,
    'bloodMoonActive' | 'player' | 'radius' | 'seed' | 'tiles'
  >;
  gameRef: MutableRefObject<GameState>;
  onVisibleTilesUpdated: (update: VisibleTilesUpdate) => void;
  playerCoord: HexCoord;
  playerCoordRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  setGame: Dispatch<SetStateAction<GameState>>;
}

export function useWorldTileResolutionLifecycle({
  enabled,
  game,
  gameRef,
  onVisibleTilesUpdated,
  playerCoord,
  playerCoordRef,
  renderInvalidationRef,
  setGame,
}: UseWorldTileResolutionLifecycleArgs) {
  const resolutionCoordinatorRef = useRef<TileResolutionCoordinator | null>(
    null,
  );
  const resolutionOverlayRef = useRef<
    ReadonlyMap<string, WorldTileResolutionOverlayEntry>
  >(new Map());
  const buildVisibleTilesRef = useRef<BuildVisibleWorldTiles>(
    buildResolvedVisibleWorldTiles,
  );
  const reuseVisibleTilesRef = useRef<ReuseVisibleTiles>((_, next) => next);
  const visibleTilesRef = useRef<VisibleWorldTile[]>(undefined!);

  const rebuildVisibleTiles = useCallback(
    ({
      overlay = resolutionOverlayRef.current,
      playerCoord,
      radius,
      resolvedTiles,
    }: RebuildVisibleWorldTilesArgs) => {
      const nextVisibleTiles = buildVisibleTilesRef.current({
        overlay,
        playerCoord,
        radius,
        resolvedTiles,
      });
      visibleTilesRef.current = reuseVisibleTilesRef.current(
        visibleTilesRef.current,
        nextVisibleTiles,
      );
      return visibleTilesRef.current;
    },
    [],
  );

  if (visibleTilesRef.current === undefined) {
    visibleTilesRef.current = buildVisibleTilesRef.current({
      overlay: resolutionOverlayRef.current,
      playerCoord: game.player.coord,
      radius: game.radius,
      resolvedTiles: game.tiles,
    });
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (resolutionCoordinatorRef.current !== null) {
      return;
    }

    let disposed = false;
    let coordinator: TileResolutionCoordinator | null = null;

    const initializeCoordinator = async () => {
      const [
        { buildVisibleWorldTiles },
        { reuseVisibleTilesIfUnchanged },
        { hydrateResolvedWorldTilePayload },
        { createLocalTileResolutionSource },
        { createWorkerTileResolutionSource },
        { createWorldTileResolutionCoordinator },
      ] = await Promise.all([
        import('../buildVisibleWorldTiles'),
        import('../../selectors/reuseVisibleTilesIfUnchanged'),
        import('../../../../game/worldTileResolutionRuntime'),
        import('./createLocalTileResolutionSource'),
        import('./createWorkerTileResolutionSource'),
        import('./worldTileResolutionCoordinator'),
      ]);

      if (disposed || resolutionCoordinatorRef.current !== null) {
        return;
      }

      buildVisibleTilesRef.current = buildVisibleWorldTiles;
      reuseVisibleTilesRef.current = reuseVisibleTilesIfUnchanged;
      rebuildVisibleTiles({
        playerCoord: gameRef.current.player.coord,
        radius: gameRef.current.radius,
        resolvedTiles: gameRef.current.tiles,
      });
      renderInvalidationRef.current += 1;

      let source;
      try {
        source = createWorkerTileResolutionSource();
      } catch {
        source = createLocalTileResolutionSource();
      }

      coordinator = createWorldTileResolutionCoordinator({
        now: () => performance.now(),
        onMergeResolvedTiles: (payloads) => {
          if (payloads.length === 0) {
            return;
          }

          setGame((current) => {
            const nextGame = mergeResolvedWorldTilePayloads({
              current,
              hydrateResolvedWorldTilePayload,
              payloads,
            });
            gameRef.current = nextGame;
            return nextGame;
          });
        },
        onOverlayChange: (overlay) => {
          resolutionOverlayRef.current = overlay;
          rebuildVisibleTiles({
            overlay,
            playerCoord: gameRef.current.player.coord,
            radius: gameRef.current.radius,
            resolvedTiles: gameRef.current.tiles,
          });
          renderInvalidationRef.current += 1;
        },
        source,
      });

      if (disposed) {
        void coordinator.dispose();
        coordinator = null;
        return;
      }

      resolutionCoordinatorRef.current = coordinator;
      try {
        await syncTileResolutionCoordinator(coordinator, gameRef.current);
      } catch (error) {
        if (!disposed) {
          console.error(error);
        }
      }
    };

    void initializeCoordinator().catch((error: unknown) => {
      if (!disposed) {
        console.error(error);
      }
    });

    return () => {
      disposed = true;
      if (resolutionCoordinatorRef.current === coordinator && coordinator) {
        resolutionCoordinatorRef.current = null;
      }
      if (coordinator !== null) {
        void coordinator.dispose();
      }
    };
  }, [enabled, gameRef, rebuildVisibleTiles, renderInvalidationRef, setGame]);

  useEffect(() => {
    const previousPlayerCoord = playerCoordRef.current;
    const previousVisibleTiles = visibleTilesRef.current;
    const nextVisibleTiles = rebuildVisibleTiles({
      playerCoord,
      radius: game.radius,
      resolvedTiles: game.tiles,
    });

    playerCoordRef.current = playerCoord;
    onVisibleTilesUpdated({
      nextVisibleTiles,
      playerCoord,
      previousPlayerCoord,
      previousVisibleTiles,
    });
  }, [
    game.radius,
    game.tiles,
    onVisibleTilesUpdated,
    playerCoord,
    playerCoordRef,
    rebuildVisibleTiles,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const coordinator = resolutionCoordinatorRef.current;
    if (!coordinator) {
      return;
    }

    void syncTileResolutionCoordinator(coordinator, game).catch(
      (error: unknown) => {
        console.error(error);
      },
    );
  }, [
    enabled,
    game,
    game.bloodMoonActive,
    game.radius,
    game.seed,
    game.tiles,
    playerCoord,
  ]);

  return {
    visibleTilesRef,
  };
}

export function mergeResolvedWorldTilePayloads({
  current,
  hydrateResolvedWorldTilePayload,
  payloads,
}: {
  current: GameState;
  hydrateResolvedWorldTilePayload: HydrateResolvedWorldTilePayload;
  payloads: ResolvedWorldTilePayload[];
}) {
  if (payloads.length === 0) {
    return current;
  }

  const nextTiles = { ...current.tiles };
  const nextEnemies = { ...current.enemies };

  for (const resolvedPayload of payloads.map(hydrateResolvedWorldTilePayload)) {
    nextTiles[hexKey(resolvedPayload.coord)] = resolvedPayload.tile;
    for (const enemy of resolvedPayload.enemies) {
      nextEnemies[enemy.id] ??= enemy;
    }
  }

  const activeWorld = getActiveWorld(current);
  if (!activeWorld) {
    return current;
  }

  return replaceWorldCollections(current, activeWorld.id, {
    tiles: nextTiles,
    enemies: nextEnemies,
  });
}

export function syncTileResolutionCoordinator(
  coordinator: TileResolutionCoordinator,
  game: Pick<
    GameState,
    'bloodMoonActive' | 'player' | 'radius' | 'seed' | 'tiles'
  >,
) {
  return coordinator.syncVisibleCoords({
    bloodMoonActive: game.bloodMoonActive,
    playerCoord: game.player.coord,
    radius: game.radius,
    resolvedTiles: game.tiles,
    seed: game.seed,
  });
}

function buildResolvedVisibleWorldTiles({
  playerCoord,
  radius,
  resolvedTiles,
}: VisibleWorldTileBuildArgs): VisibleWorldTile[] {
  return hexesInRange(playerCoord, radius).map((coord) => {
    const tile = resolvedTiles[hexKey(coord)];
    return (
      tile ?? {
        coord,
        requestedAt: 0,
        unknown: true,
        terrain: 'mountain',
        items: [],
        enemyIds: [],
      }
    );
  });
}
