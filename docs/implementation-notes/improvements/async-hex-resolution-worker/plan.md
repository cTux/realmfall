# Async Hex Resolution Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move visible-world hex and content resolution off the main thread so movement stays immediate, unresolved visible hexes render as unknown placeholders, and the client speaks through a worker-first request/response boundary that can later swap to a server adapter.

**Architecture:** Keep `GameState.tiles` authoritative and resolved-only. Add a shared tile-resolution transport contract in `packages/common`, move deterministic tile-plus-enemy payload assembly into pure client game helpers, and resolve visible frontier batches through a `TileResolutionSource` coordinator that starts with a web worker and falls back to a local synchronous resolver only if worker startup fails. Render unknown visible coords through a UI-only `VisibleWorldTile` model that preserves smooth reveal transitions without persisting pending state.

**Tech Stack:** TypeScript, React 19, Vite module workers, Pixi.js, `easy-web-worker`, `easy-cancelable-promise`, Vitest node and jsdom projects, pnpm workspaces.

---

### File Structure

- Create `packages/common/src/worldTileResolution.ts`: shared request/response DTOs for tile-resolution batches.
- Modify `packages/common/src/index.ts`: export the tile-resolution transport contract.
- Modify `packages/client/package.json`: add `easy-web-worker` and `easy-cancelable-promise`.
- Modify `pnpm-lock.yaml`: record the new client dependencies.
- Create `packages/client/src/game/worldTileResolutionPayloads.ts`: pure deterministic payload builder that turns request coords into resolved tile and enemy payloads.
- Create `packages/client/src/game/worldTileResolutionPayloads.test.ts`: node-project coverage for deterministic payload assembly.
- Modify `packages/client/game.config.ts`: add `worldClock.moveHexDurationMs` with the approved `1000` value.
- Modify `packages/client/src/game/gameConfigSchema.ts`: extend the canonical config type with `moveHexDurationMs`.
- Modify `packages/client/src/game/config.ts`: export `WORLD_MOVE_HEX_DURATION_MS`.
- Modify `packages/client/src/game/stateWorldQueries.ts`: add resolved-only read helpers for interactive paths.
- Modify `packages/client/src/game/stateWorldQueries.test.ts`: cover resolved-only lookup behavior.
- Modify `packages/client/src/game/stateWorldClock.ts`: add a focused helper for movement-time advancement.
- Modify `packages/client/src/game/stateMovement.ts`: block unresolved adjacent moves and advance `worldTimeMs` per step.
- Modify `packages/client/src/game/statePathfinding.ts`: exclude unresolved coords from safe-path routing.
- Modify `packages/client/src/game/stateExploration.test.ts`: cover blocked unresolved movement and movement-time cost per step.
- Modify `packages/client/src/i18n/locales/en.json`: add the unresolved-travel user message.
- Create `packages/client/src/app/App/world/tileResolution/TileResolutionSource.ts`: client-side source interface for worker or fallback resolution.
- Create `packages/client/src/app/App/world/tileResolution/createLocalTileResolutionSource.ts`: synchronous fallback source backed by the pure payload builder.
- Create `packages/client/src/app/App/world/tileResolution/createWorkerTileResolutionSource.ts`: `easy-web-worker` source wrapper for the module worker.
- Create `packages/client/src/app/App/world/tileResolution/worldTileResolution.worker.ts`: worker entrypoint using `createStaticEasyWebWorker`.
- Create `packages/client/src/app/App/world/tileResolution/worldTileResolutionCoordinator.ts`: viewport-aware batching, cancellation, stale-response rejection, and merge orchestration.
- Create `packages/client/src/app/App/world/tileResolution/worldTileResolutionCoordinator.test.ts`: node-project coverage for batching, cancellation, fallback, and merge semantics.
- Create `packages/client/src/ui/world/visibleWorldTiles.ts`: render-only visible tile union plus render-key and transition helpers.
- Modify `packages/client/src/app/App/selectors/reuseVisibleTilesIfUnchanged.ts`: compare already-built visible presentation tiles instead of regenerating sync world tiles.
- Modify `packages/client/src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts`: cover reuse when tiles change from pending to resolved.
- Create `packages/client/src/app/App/world/buildVisibleWorldTiles.ts`: turn resolved tiles plus overlay state into `VisibleWorldTile[]`.
- Modify `packages/client/src/app/App/usePixiWorld.ts`: own the non-persisted overlay, drive frontier resolution, and rebuild visible presentation tiles.
- Modify `packages/client/src/app/App/world/worldRenderSnapshot.ts`: update the visible-tiles snapshot type.
- Modify `packages/client/src/app/App/world/pixiWorldRenderLoop.ts`: accept `VisibleWorldTile[]` and redraw when transition tokens advance.
- Modify `packages/client/src/app/App/world/pixiWorldBootstrap.ts`: preload only the currently visible resolved and unknown icons.
- Modify `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`: refuse unresolved targets without sync generation and keep `worldTimeMsRef` aligned with moved state.
- Modify `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`: cover unresolved-target blocking and `worldTimeMsRef` sync.
- Modify `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`: stop tooltip or path analysis for unresolved visible hexes.
- Modify `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`: assert hover and click avoid sync tile generation, including unknown placeholders inside the visible ring.
- Modify `packages/client/src/ui/world/worldIcons.ts`: register the unknown-hex icon and include it in visible-icon preload lists.
- Modify `packages/client/src/ui/world/worldIcons.test.ts`: cover the unknown-hex icon preload path.
- Modify `packages/client/src/ui/world/renderScene.ts`: accept `VisibleWorldTile[]` and pass animation time into transition-aware static rendering.
- Modify `packages/client/src/ui/world/renderSceneCache.ts`: track transition-sensitive render inputs.
- Modify `packages/client/src/ui/world/renderSceneTokens.ts`: derive static and interaction tokens from resolved and unknown visible tiles plus reveal progress buckets.
- Modify `packages/client/src/ui/world/renderSceneRenderInputs.ts`: skip enemy lookup work for unknown tiles.
- Modify `packages/client/src/ui/world/renderSceneTilePasses.ts`: treat unresolved visible hexes as non-clickable and non-path-highlighted.
- Modify `packages/client/src/ui/world/renderSceneStaticTiles.ts`: render unknown hexes without terrain art and fade resolved terrain in.
- Modify `packages/client/src/ui/world/renderSceneStaticMarkers.ts`: draw the unknown dice icon, crossfade it to resolved content, or fade it out when no content exists.
- Modify `packages/client/src/ui/world/renderSceneInteractions.test.ts`: cover unknown-hex visuals and resolved reveal behavior.
- Modify `packages/client/src/app/App/hooks/useHexGameplayView.ts`: stop building current-hex data synchronously.
- Modify `packages/client/src/ui/world/renderSceneClaimBorders.ts`: remove sync `buildTile(...)` fallback from neighbor-claim reads.
- Modify `docs/specs/reference/gameplay-features/world-exploration/spec.md`: document unknown visible hexes, unresolved movement blocking, and movement-time cost.
- Modify `docs/specs/reference/technical-solutions/deterministic-world-generation/spec.md`: document worker-facing deterministic payload assembly.
- Create `docs/specs/reference/technical-solutions/async-world-tile-resolution/spec.md`: record the shipped worker-first resolution pipeline.
- Modify `docs/specs/reference/technical-solutions/README.md`: add the new technical-solution spec entry.

### Task 1: Add The Shared Tile-Resolution Contract And Deterministic Payload Builder

**Files:**

- Create: `packages/common/src/worldTileResolution.ts`
- Modify: `packages/common/src/index.ts`
- Modify: `packages/client/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/client/src/game/worldTileResolutionPayloads.ts`
- Create: `packages/client/src/game/worldTileResolutionPayloads.test.ts`

- [ ] **Step 1: Write the failing deterministic payload test**

Create `packages/client/src/game/worldTileResolutionPayloads.test.ts`:

```ts
import type { ResolveWorldTilesRequest } from '@realmfall/common';
import { resolveWorldTiles } from './worldTileResolutionPayloads';

describe('resolveWorldTiles', () => {
  it('returns deterministic tile and enemy payloads for a request batch', () => {
    const request: ResolveWorldTilesRequest = {
      requestId: 'req-1',
      seed: 'worker-payload-seed',
      bloodMoonActive: false,
      coords: [
        { q: 2, r: 0 },
        { q: 2, r: -1 },
      ],
    };

    const first = resolveWorldTiles(request);
    const second = resolveWorldTiles(request);

    expect(second).toEqual(first);
    expect(first.requestId).toBe('req-1');
    expect(first.tiles.map((entry) => entry.coord)).toEqual(request.coords);
    expect(
      first.tiles.every((entry) =>
        entry.tile.enemyIds.every((enemyId) =>
          entry.enemies.some((enemy) => enemy.id === enemyId),
        ),
      ),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the payload test to verify it fails**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/worldTileResolutionPayloads.test.ts
```

Expected: FAIL because the shared contract and payload builder files do not exist.

- [ ] **Step 3: Add the common contract, dependencies, and pure payload builder**

Create `packages/common/src/worldTileResolution.ts`:

```ts
export interface TileResolutionCoord {
  q: number;
  r: number;
}

export interface TileResolutionNpc {
  name: string;
  enemyId?: string;
}

export interface TileResolutionClaim {
  ownerId: string;
  ownerType: 'player' | 'faction';
  ownerName: string;
  borderColor: string;
  npc?: TileResolutionNpc;
}

export interface TileResolutionItem {
  id: string;
  itemKey?: string;
  icon?: string;
  name: string;
  quantity: number;
  tier: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requiredLevel?: number;
  power: number;
  defense: number;
  maxHp: number;
  healing: number;
  hunger: number;
  thirst?: number;
  secondaryStatCapacity?: number;
  secondaryStats?: Array<{ key: string; value: number }>;
  reforgedSecondaryStatIndex?: number;
  enchantedSecondaryStatIndex?: number;
  corrupted?: boolean;
  grantedAbilityId?: string;
}

export interface TileResolutionEnemy {
  id: string;
  enemyTypeId?: string;
  name: string;
  coord: TileResolutionCoord;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  tier: number;
  baseMaxHp?: number;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  baseAttack?: number;
  attack: number;
  baseDefense?: number;
  defense: number;
  xp: number;
  elite: boolean;
  worldBoss?: boolean;
  aggressive?: boolean;
  abilityIds?: string[];
}

export interface TileResolutionTile {
  coord: TileResolutionCoord;
  terrain: string;
  structure?: string;
  structureHp?: number;
  structureMaxHp?: number;
  townStockDay?: number;
  townStockPurchasedItemIds?: string[];
  items: TileResolutionItem[];
  enemyIds: string[];
  claim?: TileResolutionClaim;
}

export interface ResolvedWorldTilePayload {
  coord: TileResolutionCoord;
  tile: TileResolutionTile;
  enemies: TileResolutionEnemy[];
}

export interface ResolveWorldTilesRequest {
  requestId: string;
  seed: string;
  bloodMoonActive: boolean;
  coords: TileResolutionCoord[];
}

export interface ResolveWorldTilesResponse {
  requestId: string;
  tiles: ResolvedWorldTilePayload[];
}
```

Export it from `packages/common/src/index.ts`:

```ts
export * from './worldTileResolution';
```

Add the client dependencies to `packages/client/package.json`:

```json
"dependencies": {
  "@realmfall/common": "workspace:*",
  "@realmfall/ui": "workspace:*",
  "@rexa-developer/tiks": "^0.1.8",
  "easy-cancelable-promise": "^2.0.1",
  "easy-web-worker": "^7.0.5",
  "pixi.js": "^8.18.1",
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "react-use-audio-player": "^4.0.2"
}
```

Create `packages/client/src/game/worldTileResolutionPayloads.ts`:

```ts
import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
  ResolvedWorldTilePayload,
} from '@realmfall/common';
import { enemyIndexFromId, makeEnemy } from './combat';
import { isFactionNpcEnemyId } from './territories';
import { buildTile } from './world';
import { isWorldBossEnemyId } from './worldBoss';

export function resolveWorldTiles(
  request: ResolveWorldTilesRequest,
): ResolveWorldTilesResponse {
  return {
    requestId: request.requestId,
    tiles: request.coords.map((coord) =>
      buildResolvedWorldTilePayload(
        request.seed,
        coord,
        request.bloodMoonActive,
      ),
    ),
  };
}

function buildResolvedWorldTilePayload(
  seed: string,
  coord: ResolveWorldTilesRequest['coords'][number],
  bloodMoonActive: boolean,
): ResolvedWorldTilePayload {
  const tile = buildTile(seed, coord);
  const enemies = tile.enemyIds.map((enemyId) =>
    makeEnemy(
      seed,
      coord,
      tile.terrain,
      enemyIndexFromId(enemyId),
      tile.structure,
      bloodMoonActive,
      {
        enemyId,
        aggressive: !isFactionNpcEnemyId(enemyId),
        name:
          tile.claim?.npc?.enemyId === enemyId
            ? tile.claim.npc.name
            : undefined,
        worldBoss: isWorldBossEnemyId(enemyId),
      },
    ),
  );

  return {
    coord,
    tile,
    enemies,
  };
}
```

- [ ] **Step 4: Run the payload test and package checks**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/worldTileResolutionPayloads.test.ts
pnpm --filter @realmfall/common typecheck
pnpm --filter @realmfall/client typecheck
```

Expected:

- The new payload suite passes.
- `@realmfall/common` exports compile cleanly.
- `@realmfall/client` compiles with the new common import and dependencies.

### Task 2: Add Resolved-Only Movement Rules And Per-Hex World Time Cost

**Files:**

- Modify: `packages/client/game.config.ts`
- Modify: `packages/client/src/game/gameConfigSchema.ts`
- Modify: `packages/client/src/game/config.ts`
- Modify: `packages/client/src/game/stateWorldQueries.ts`
- Modify: `packages/client/src/game/stateWorldQueries.test.ts`
- Modify: `packages/client/src/game/stateWorldClock.ts`
- Modify: `packages/client/src/game/stateMovement.ts`
- Modify: `packages/client/src/game/statePathfinding.ts`
- Modify: `packages/client/src/game/stateExploration.test.ts`
- Modify: `packages/client/src/i18n/locales/en.json`

- [ ] **Step 1: Add failing gameplay tests for unresolved movement and movement-time cost**

Extend `packages/client/src/game/stateExploration.test.ts` with:

```ts
it('blocks movement onto an unresolved adjacent hex', () => {
  const game = createGame(4, 'unresolved-adjacent-move');
  game.player.coord = { q: 1, r: 0 };
  delete game.tiles['2,0'];

  const next = moveToTile(game, { q: 2, r: 0 });

  expect(next.player.coord).toEqual({ q: 1, r: 0 });
  expect(next.logs.at(-1)?.text).toContain('not resolved yet');
});

it('adds one moveHexDurationMs cost per successful step', () => {
  const game = createGame(4, 'movement-time-cost');
  game.worldTimeMs = 12_345;
  game.tiles['1,0'] = {
    coord: { q: 1, r: 0 },
    terrain: 'plains',
    items: [],
    enemyIds: [],
  };

  const moved = moveToTile(game, { q: 1, r: 0 });

  expect(moved.worldTimeMs).toBe(
    12_345 + GAME_CONFIG.worldClock.moveHexDurationMs,
  );
});
```

Extend `packages/client/src/game/stateWorldQueries.test.ts` with:

```ts
import { getResolvedTileAt } from './stateWorldQueries';

it('returns null for unresolved coordinates without generating a tile', () => {
  const game = createGame(3, 'resolved-tile-only-query');

  expect(getResolvedTileAt(game, { q: 6, r: -3 })).toBeNull();
});
```

- [ ] **Step 2: Run the gameplay suites to verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateExploration.test.ts src/game/stateWorldQueries.test.ts
```

Expected: FAIL because movement auto-generates target tiles and there is no movement-time config or resolved-only query helper.

- [ ] **Step 3: Add the config, resolved-only helpers, and movement-time behavior**

Update `packages/client/game.config.ts`:

```ts
  worldClock: {
    // Real milliseconds required for one complete 24-hour in-game day.
    dayDurationMs: 5 * 60_000,
    // In-game time cost applied for each hex the player successfully crosses.
    moveHexDurationMs: 1_000,
  },
```

Update `packages/client/src/game/gameConfigSchema.ts`:

```ts
worldClock: {
  dayDurationMs: number;
  moveHexDurationMs: number;
}
```

Update `packages/client/src/game/config.ts`:

```ts
export const WORLD_MOVE_HEX_DURATION_MS =
  GAME_CONFIG.worldClock.moveHexDurationMs;
```

Add the resolved-only helper in `packages/client/src/game/stateWorldQueries.ts`:

```ts
export function getResolvedTileAt(state: WorldTileState, coord: HexCoord) {
  return state.tiles[hexKey(coord)] ?? null;
}
```

Add a focused world-clock helper in `packages/client/src/game/stateWorldClock.ts`:

```ts
import { WORLD_MOVE_HEX_DURATION_MS } from './config';

export function advanceWorldTimeForMovement(state: GameState, steps = 1) {
  if (steps <= 0) {
    return state.worldTimeMs;
  }

  return state.worldTimeMs + WORLD_MOVE_HEX_DURATION_MS * steps;
}
```

Update `packages/client/src/game/stateMovement.ts`:

```ts
import { advanceWorldTimeForMovement } from './stateWorldClock';
import { getResolvedTileAt, getHostileEnemyIds } from './stateWorldQueries';

const tile = getResolvedTileAt(next, target);
if (!tile) {
  return message(next, t('game.message.travel.unknownHex'));
}

if (!isPassable(tile.terrain)) {
  return message(next, t('game.message.travel.blockedTerrain'));
}

next.turn += 1;
next.worldTimeMs = advanceWorldTimeForMovement(next, 1);
applySurvivalDecay(next);
next.player.coord = target;
```

Update `packages/client/src/game/statePathfinding.ts`:

```ts
import { getHostileEnemyIds, getResolvedTileAt } from './stateWorldQueries';

const tile = getResolvedTileAt(state, neighbor);
if (!tile) continue;
if (!isPassable(tile.terrain)) continue;
```

Add the locale string in `packages/client/src/i18n/locales/en.json`:

```json
"game.message.travel.unknownHex": "That hex has not resolved yet.",
```

- [ ] **Step 4: Run the targeted gameplay verification**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateExploration.test.ts src/game/stateWorldQueries.test.ts
pnpm --filter @realmfall/client typecheck
```

Expected:

- The exploration suite passes with unresolved movement blocked and world time advancing by `1000`.
- The world-query suite passes with `getResolvedTileAt`.
- Typecheck passes with the expanded config contract.

### Task 3: Build The Worker And Coordinator Boundary

**Files:**

- Create: `packages/client/src/app/App/world/tileResolution/TileResolutionSource.ts`
- Create: `packages/client/src/app/App/world/tileResolution/createLocalTileResolutionSource.ts`
- Create: `packages/client/src/app/App/world/tileResolution/createWorkerTileResolutionSource.ts`
- Create: `packages/client/src/app/App/world/tileResolution/worldTileResolution.worker.ts`
- Create: `packages/client/src/app/App/world/tileResolution/worldTileResolutionCoordinator.ts`
- Create: `packages/client/src/app/App/world/tileResolution/worldTileResolutionCoordinator.test.ts`

- [ ] **Step 1: Write the failing coordinator tests**

Create `packages/client/src/app/App/world/tileResolution/worldTileResolutionCoordinator.test.ts`:

```ts
import { CancelablePromise } from 'easy-cancelable-promise';
import { createWorldTileResolutionCoordinator } from './worldTileResolutionCoordinator';

describe('createWorldTileResolutionCoordinator', () => {
  it('requests only missing visible coords and merges them on success', async () => {
    const resolve = vi.fn((request) =>
      CancelablePromise.resolve({
        requestId: request.requestId,
        tiles: request.coords.map((coord) => ({
          coord,
          tile: {
            coord,
            terrain: 'plains',
            items: [],
            enemyIds: [],
          },
          enemies: [],
        })),
      }),
    );
    const mergedPayloads: unknown[] = [];
    const coordinator = createWorldTileResolutionCoordinator({
      now: () => 1_000,
      onMergeResolvedTiles: (payloads) => mergedPayloads.push(payloads),
      onOverlayChange: () => undefined,
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

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(mergedPayloads).toHaveLength(1);
  });

  it('cancels the previous frontier request and ignores its late response', async () => {
    let resolveLate: ((value: unknown) => void) | null = null;
    const source = {
      resolve: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new CancelablePromise((resolve) => {
              resolveLate = resolve;
            }),
        )
        .mockImplementationOnce((request) =>
          CancelablePromise.resolve({
            requestId: request.requestId,
            tiles: [],
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

    void coordinator.syncVisibleCoords({
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

    resolveLate?.({
      requestId: 'stale-request',
      tiles: [
        {
          coord: { q: 0, r: 0 },
          tile: {
            coord: { q: 0, r: 0 },
            terrain: 'plains',
            items: [],
            enemyIds: [],
          },
          enemies: [],
        },
      ],
    });
    await Promise.resolve();

    expect(onMergeResolvedTiles).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the coordinator suite to verify it fails**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/tileResolution/worldTileResolutionCoordinator.test.ts
```

Expected: FAIL because the tile-resolution source and coordinator modules do not exist.

- [ ] **Step 3: Implement the worker source, fallback source, and coordinator**

Create `packages/client/src/app/App/world/tileResolution/TileResolutionSource.ts`:

```ts
import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import type { CancelablePromise } from 'easy-cancelable-promise';

export interface TileResolutionSource {
  resolve(
    request: ResolveWorldTilesRequest,
  ): CancelablePromise<ResolveWorldTilesResponse>;
  dispose(): Promise<void>;
}
```

Create `packages/client/src/app/App/world/tileResolution/createLocalTileResolutionSource.ts`:

```ts
import { CancelablePromise } from 'easy-cancelable-promise';
import { resolveWorldTiles } from '../../../../game/worldTileResolutionPayloads';
import type { TileResolutionSource } from './TileResolutionSource';

export function createLocalTileResolutionSource(): TileResolutionSource {
  return {
    resolve(request) {
      return CancelablePromise.resolve(resolveWorldTiles(request));
    },
    async dispose() {},
  };
}
```

Create `packages/client/src/app/App/world/tileResolution/worldTileResolution.worker.ts`:

```ts
import { createStaticEasyWebWorker } from 'easy-web-worker';
import { resolveWorldTiles } from '../../../../game/worldTileResolutionPayloads';
import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';

createStaticEasyWebWorker<ResolveWorldTilesRequest, ResolveWorldTilesResponse>(
  (message) => {
    message.resolve(resolveWorldTiles(message.payload));
  },
);
```

Create `packages/client/src/app/App/world/tileResolution/createWorkerTileResolutionSource.ts`:

```ts
import { createEasyWebWorker } from 'easy-web-worker';
import type { TileResolutionSource } from './TileResolutionSource';
import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';

export function createWorkerTileResolutionSource(): TileResolutionSource {
  const worker = createEasyWebWorker<
    ResolveWorldTilesRequest,
    ResolveWorldTilesResponse
  >(new URL('./worldTileResolution.worker.ts', import.meta.url), {
    keepAlive: true,
    name: 'world-tile-resolution',
    workerOptions: { type: 'module' },
  });

  return {
    resolve(request) {
      return worker.send(request);
    },
    async dispose() {
      await worker.dispose();
    },
  };
}
```

Create `packages/client/src/app/App/world/tileResolution/worldTileResolutionCoordinator.ts`:

```ts
import { hexKey, hexesInRange } from '../../../../game/hex';
import type { GameState } from '../../../../game/stateTypes';
import type { ResolvedWorldTilePayload } from '@realmfall/common';
import type { TileResolutionSource } from './TileResolutionSource';

type OverlayEntry =
  | { status: 'pending'; requestedAt: number }
  | { status: 'revealed'; requestedAt: number; resolvedAt: number };

export function createWorldTileResolutionCoordinator({
  now,
  onMergeResolvedTiles,
  onOverlayChange,
  source,
}: {
  now: () => number;
  onMergeResolvedTiles: (payloads: ResolvedWorldTilePayload[]) => void;
  onOverlayChange: (overlay: ReadonlyMap<string, OverlayEntry>) => void;
  source: TileResolutionSource;
}) {
  const overlay = new Map<string, OverlayEntry>();
  let activeRequestId = 0;
  let inFlight: ReturnType<TileResolutionSource['resolve']> | null = null;

  const publishOverlay = () => onOverlayChange(new Map(overlay));

  async function syncVisibleCoords({
    bloodMoonActive,
    playerCoord,
    radius,
    resolvedTiles,
    seed,
  }: {
    bloodMoonActive: GameState['bloodMoonActive'];
    playerCoord: GameState['player']['coord'];
    radius: GameState['radius'];
    resolvedTiles: GameState['tiles'];
    seed: GameState['seed'];
  }) {
    const requestedAt = now();
    const missingCoords = hexesInRange(playerCoord, radius).filter((coord) => {
      const key = hexKey(coord);
      if (resolvedTiles[key]) {
        return false;
      }
      if (overlay.get(key)?.status === 'pending') {
        return false;
      }
      overlay.set(key, { status: 'pending', requestedAt });
      return true;
    });

    publishOverlay();
    if (missingCoords.length === 0) {
      return;
    }

    inFlight?.cancel('visible-frontier-changed');
    const requestId = `resolve-${activeRequestId + 1}`;
    activeRequestId += 1;
    const request = {
      requestId,
      seed,
      bloodMoonActive,
      coords: missingCoords,
    };

    const promise = source.resolve(request);
    inFlight = promise;

    try {
      const response = await promise;
      if (response.requestId !== requestId) {
        return;
      }

      const resolvedAt = now();
      response.tiles.forEach((payload) => {
        const key = hexKey(payload.coord);
        const current = overlay.get(key);
        overlay.set(key, {
          status: 'revealed',
          requestedAt:
            current?.status === 'pending' ? current.requestedAt : resolvedAt,
          resolvedAt,
        });
      });
      onMergeResolvedTiles(response.tiles);
      publishOverlay();
    } catch (error) {
      if (promise.status === 'canceled') {
        return;
      }
      throw error;
    }
  }

  return {
    getOverlay: () => new Map(overlay),
    syncVisibleCoords,
    dispose: () => source.dispose(),
  };
}
```

- [ ] **Step 4: Run the coordinator suite and targeted typecheck**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/tileResolution/worldTileResolutionCoordinator.test.ts
pnpm --filter @realmfall/client typecheck
```

Expected:

- The coordinator suite passes with batching and stale-response rejection covered.
- Client typecheck passes with the worker modules and cancelable source interface.

### Task 4: Build The Visible Presentation Tile Model And Integrate Frontier Resolution Into `usePixiWorld`

**Files:**

- Create: `packages/client/src/ui/world/visibleWorldTiles.ts`
- Create: `packages/client/src/app/App/world/buildVisibleWorldTiles.ts`
- Modify: `packages/client/src/app/App/selectors/reuseVisibleTilesIfUnchanged.ts`
- Modify: `packages/client/src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts`
- Modify: `packages/client/src/app/App/usePixiWorld.ts`
- Modify: `packages/client/src/app/App/world/worldRenderSnapshot.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldRenderLoop.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldBootstrap.ts`

- [ ] **Step 1: Add failing visible-tile reuse tests for pending-to-resolved transitions**

Extend `packages/client/src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts` with:

```ts
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';

it('returns a new array when a visible coord changes from unknown to resolved', () => {
  const previous: VisibleWorldTile[] = [
    { coord: { q: 0, r: 0 }, requestedAt: 1_000 },
  ];
  const next: VisibleWorldTile[] = [
    {
      coord: { q: 0, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
      requestedAt: 1_000,
      resolvedAt: 1_250,
    },
  ];

  expect(reuseVisibleTilesIfUnchanged(previous, next)).toBe(next);
});
```

- [ ] **Step 2: Run the selector suite to verify it fails**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts
```

Expected: FAIL because there is no `VisibleWorldTile` model and the selector expects to regenerate visible tiles from synchronous world queries.

- [ ] **Step 3: Add the visible presentation model, array reuse helper, and `usePixiWorld` integration**

Create `packages/client/src/ui/world/visibleWorldTiles.ts`:

```ts
import { hexKey, type HexCoord } from '../../game/hex';
import type { Tile } from '../../game/stateTypes';

export const WORLD_HEX_REVEAL_DURATION_MS = 220;

export interface UnknownVisibleWorldTile {
  coord: HexCoord;
  requestedAt: number;
}

export type ResolvedVisibleWorldTile = Tile & {
  requestedAt?: number;
  resolvedAt?: number;
};

export type VisibleWorldTile =
  | UnknownVisibleWorldTile
  | ResolvedVisibleWorldTile;

export function isUnknownVisibleWorldTile(
  tile: VisibleWorldTile,
): tile is UnknownVisibleWorldTile {
  return !('terrain' in tile);
}

export function getVisibleWorldTileRenderKey(tile: VisibleWorldTile) {
  if (isUnknownVisibleWorldTile(tile)) {
    return `${hexKey(tile.coord)}|unknown|${tile.requestedAt}`;
  }

  return [
    hexKey(tile.coord),
    tile.terrain,
    tile.structure ?? 'none',
    tile.items.length,
    tile.enemyIds.join(','),
    tile.claim
      ? `${tile.claim.ownerType}:${tile.claim.ownerId}:${tile.claim.npc?.enemyId ?? 'none'}`
      : 'claim:none',
    tile.requestedAt ?? 0,
    tile.resolvedAt ?? 0,
  ].join('|');
}
```

Create `packages/client/src/app/App/world/buildVisibleWorldTiles.ts`:

```ts
import { hexKey, hexesInRange, type HexCoord } from '../../../game/hex';
import type { GameState } from '../../../game/stateTypes';
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';

type OverlayEntry =
  | { status: 'pending'; requestedAt: number }
  | { status: 'revealed'; requestedAt: number; resolvedAt: number };

export function buildVisibleWorldTiles({
  overlay,
  playerCoord,
  radius,
  resolvedTiles,
}: {
  overlay: ReadonlyMap<string, OverlayEntry>;
  playerCoord: HexCoord;
  radius: GameState['radius'];
  resolvedTiles: GameState['tiles'];
}) {
  const visibleTiles: VisibleWorldTile[] = [];

  for (const coord of hexesInRange(playerCoord, radius)) {
    const key = hexKey(coord);
    const resolvedTile = resolvedTiles[key];
    const overlayEntry = overlay.get(key);

    if (resolvedTile) {
      visibleTiles.push(
        overlayEntry?.status === 'revealed'
          ? {
              ...resolvedTile,
              requestedAt: overlayEntry.requestedAt,
              resolvedAt: overlayEntry.resolvedAt,
            }
          : resolvedTile,
      );
      continue;
    }

    if (overlayEntry?.status === 'pending') {
      visibleTiles.push({
        coord,
        requestedAt: overlayEntry.requestedAt,
      });
    }
  }

  return visibleTiles;
}
```

Replace `packages/client/src/app/App/selectors/reuseVisibleTilesIfUnchanged.ts` with an already-built array comparer:

```ts
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';
import { getVisibleWorldTileRenderKey } from '../../../ui/world/visibleWorldTiles';

export function reuseVisibleTilesIfUnchanged(
  previousVisibleTiles: VisibleWorldTile[],
  nextVisibleTiles: VisibleWorldTile[],
) {
  return previousVisibleTiles.length === nextVisibleTiles.length &&
    previousVisibleTiles.every(
      (tile, index) =>
        getVisibleWorldTileRenderKey(tile) ===
        getVisibleWorldTileRenderKey(nextVisibleTiles[index]!),
    )
    ? previousVisibleTiles
    : nextVisibleTiles;
}
```

Update the `usePixiWorld` visible-tiles effect in `packages/client/src/app/App/usePixiWorld.ts`:

```ts
const resolutionOverlayRef = useRef(new Map());
const resolutionCoordinatorRef = useRef<ReturnType<
  typeof createWorldTileResolutionCoordinator
> | null>(null);

useEffect(() => {
  if (resolutionCoordinatorRef.current === null) {
    const workerSource = (() => {
      try {
        return createWorkerTileResolutionSource();
      } catch {
        return createLocalTileResolutionSource();
      }
    })();

    resolutionCoordinatorRef.current = createWorldTileResolutionCoordinator({
      now: () => performance.now(),
      onMergeResolvedTiles: (payloads) => {
        setGame((current) => {
          const nextTiles = { ...current.tiles };
          const nextEnemies = { ...current.enemies };

          for (const payload of payloads) {
            nextTiles[hexKey(payload.coord)] = payload.tile;
            for (const enemy of payload.enemies) {
              nextEnemies[enemy.id] ??= enemy;
            }
          }

          return {
            ...current,
            tiles: nextTiles,
            enemies: nextEnemies,
          };
        });
      },
      onOverlayChange: (overlay) => {
        resolutionOverlayRef.current = overlay;
        const nextVisibleTiles = buildVisibleWorldTiles({
          overlay,
          playerCoord: playerCoordRef.current,
          radius: gameRef.current.radius,
          resolvedTiles: gameRef.current.tiles,
        });
        visibleTilesRef.current = reuseVisibleTilesIfUnchanged(
          visibleTilesRef.current,
          nextVisibleTiles,
        );
        renderInvalidationRef.current += 1;
      },
      source: workerSource,
    });
  }

  void resolutionCoordinatorRef.current.syncVisibleCoords({
    bloodMoonActive: game.bloodMoonActive,
    playerCoord: game.player.coord,
    radius: game.radius,
    resolvedTiles: game.tiles,
    seed: game.seed,
  });
}, [
  game.bloodMoonActive,
  game.player.coord,
  game.radius,
  game.seed,
  game.tiles,
  setGame,
]);
```

Update `packages/client/src/app/App/world/worldRenderSnapshot.ts` and `pixiWorldRenderLoop.ts` to use `VisibleWorldTile[]` instead of `ReturnType<typeof getVisibleTiles>`.

- [ ] **Step 4: Run the selector and hook-adjacent suites**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts src/app/App/world/pixiWorldRenderLoop.test.ts
pnpm --filter @realmfall/client typecheck
```

Expected:

- The reuse selector passes for pending-to-resolved transitions.
- The render-loop suite stays green with the new visible-tile union type.
- Typecheck passes with the coordinator and visible presentation model wired into `usePixiWorld`.

### Task 5: Render Unknown Hexes, Block Their Interaction, And Reveal Them Smoothly

**Files:**

- Modify: `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`
- Modify: `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`
- Modify: `packages/client/src/ui/world/worldIcons.ts`
- Modify: `packages/client/src/ui/world/worldIcons.test.ts`
- Modify: `packages/client/src/ui/world/renderScene.ts`
- Modify: `packages/client/src/ui/world/renderSceneCache.ts`
- Modify: `packages/client/src/ui/world/renderSceneTokens.ts`
- Modify: `packages/client/src/ui/world/renderSceneRenderInputs.ts`
- Modify: `packages/client/src/ui/world/renderSceneTilePasses.ts`
- Modify: `packages/client/src/ui/world/renderSceneStaticTiles.ts`
- Modify: `packages/client/src/ui/world/renderSceneStaticMarkers.ts`
- Modify: `packages/client/src/ui/world/renderSceneInteractions.test.ts`

- [ ] **Step 1: Add failing render and interaction tests for unknown hexes**

Extend `packages/client/src/ui/world/renderSceneInteractions.test.ts` with:

```ts
it('renders unknown visible hexes without terrain art and with the dice marker', async () => {
  const { renderScene } = await import('./renderScene');
  const { WorldIcons } = await import('./worldIcons');
  const app = createMockApp();
  const game = createGame(2, 'render-scene-unknown-hex');

  renderScene(
    app as never,
    game,
    [
      { coord: { q: 0, r: 0 }, terrain: 'plains', items: [], enemyIds: [] },
      { coord: { q: 1, r: 0 }, requestedAt: 1_000 },
    ],
    game.player.coord,
    null,
    12 * 60,
    1_050,
  );

  const worldDescendants = collectDescendants(getWorld(app));
  const unknownSprites = worldDescendants.filter(
    (child): child is MockSprite =>
      child instanceof MockSprite && child.icon === WorldIcons.UnknownHex,
  );

  expect(unknownSprites).toHaveLength(1);
});
```

Extend `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts` with:

```ts
it('ignores adjacent clicks when the target hex has not resolved yet', () => {
  const game = createGame(2, 'unresolved-adjacent-click');
  delete game.tiles['1,0'];
  const setGame = vi.fn();
  const adjacentPoint = tileToPoint(
    { q: 1, r: 0 },
    app.screen.width / 2,
    app.screen.height / 2,
    getWorldHexSize(app.screen, game.radius),
  );

  const handleClick = createWorldClickHandler({
    app: app as never,
    gameRef: { current: game },
    getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    setGame,
    worldTimeMsRef: { current: game.worldTimeMs },
  });

  handleClick(320, 240);

  expect(setGame).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the jsdom and node suites to verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/ui/world/renderSceneInteractions.test.ts src/app/App/tests/App.worldInteractionPerformance.test.tsx
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldClickNavigation.test.ts src/ui/world/worldIcons.test.ts
```

Expected: FAIL because unknown visible hexes do not exist yet, renderScene requires resolved `Tile[]`, and click navigation relies on synchronous tile lookup.

- [ ] **Step 3: Implement unknown-hex rendering, hover blocking, and movement-ref sync**

Add the icon to `packages/client/src/ui/world/worldIcons.ts`:

```ts
import unknownHexIcon from '../../assets/game-icons/delapouite/perspective-dice-six-faces-random.svg';

export const WorldIcons = {
  Player: playerIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  Village: tearTracksIcon,
  Castle: castleIcon,
  ForgottenLoot: forgottenLootIcon,
  UnknownHex: unknownHexIcon,
} as const;
```

Make `getVisibleWorldIconAssetIds` accept `VisibleWorldTile[]` and include the unknown icon:

```ts
for (const tile of visibleTiles) {
  if (isUnknownVisibleWorldTile(tile)) {
    iconAssetIds.add(WorldIcons.UnknownHex);
    continue;
  }

  iconAssetIds.add(terrainArtFor(tile.terrain));
  // existing resolved marker logic continues here
}
```

Update `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`:

```ts
import { getResolvedTileAt } from '../../../game/stateWorldQueries';

const tile = getResolvedTileAt(current, target);
if (!tile || !isPassable(tile.terrain)) {
  return;
}

setGame((currentState) => {
  const nextState = createLoggedGameTransition({
    describe: () => t('game.log.command.moveToTile'),
    transition: (timedState) => moveToTile(timedState, target),
  })({
    ...currentState,
    worldTimeMs: worldTimeMsRef.current,
  });
  worldTimeMsRef.current = nextState.worldTimeMs;
  return nextState;
});
```

Update `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`:

```ts
import {
  getResolvedTileAt,
  getEnemiesAt,
} from '../../../game/stateWorldQueries';

if (distance === 1) {
  tile = getResolvedTileAt(current, target);
  actionable = Boolean(tile && isPassable(tile.terrain));
} else if (distance > 1 && withinVisibleMap) {
  safePath = getSafePathToTile(current, target);
  actionable = Boolean(safePath);
  tile = actionable ? getResolvedTileAt(current, target) : null;
}
```

Update the render path so unresolved tiles draw as unknown placeholders and resolved tiles reveal over `WORLD_HEX_REVEAL_DURATION_MS`:

```ts
// renderSceneRenderInputs.ts
export interface VisibleTileRenderInput {
  enemies: VisibleTileEnemies;
  hostileEnemies: VisibleTileEnemies;
  tile: VisibleWorldTile;
}

export function getVisibleTileRenderInput(
  state: GameState,
  tile: VisibleWorldTile,
): VisibleTileRenderInput {
  if (isUnknownVisibleWorldTile(tile)) {
    return {
      enemies: [],
      hostileEnemies: [],
      tile,
    };
  }

  const enemies = getEnemiesAt(state, tile.coord);
  return {
    enemies,
    hostileEnemies: enemies.filter((enemy) => enemy.aggressive !== false),
    tile,
  };
}
```

```ts
// renderSceneStaticTiles.ts
if (isUnknownVisibleWorldTile(tile)) {
  renderStaticMarkers({
    enemyIconSize,
    point,
    scene,
    shadowOffset,
    state,
    structureIconSize,
    tile,
    visibleTileMap,
    visibleTileRenderInput,
    worldBossIconSize,
  });
  return;
}

const revealProgress =
  tile.resolvedAt == null
    ? 1
    : Math.min(
        1,
        Math.max(
          0,
          (animationMs - tile.resolvedAt) / WORLD_HEX_REVEAL_DURATION_MS,
        ),
      );

if (showTerrainBackgrounds) {
  const terrainSprite = takeSprite(
    scene.worldTerrainSprites,
    terrainArtFor(tile.terrain),
  );
  configureSprite(
    terrainSprite,
    0xffffff,
    terrainArtSize,
    terrainArtSize,
    (emphasized ? 0.84 : 0.76) * revealProgress,
    point,
  );
}
```

```ts
// renderSceneStaticMarkers.ts
if (isUnknownVisibleWorldTile(tile)) {
  const marker = takeShadowedSprite(
    scene.worldStaticMarkerSprites,
    WorldIcons.UnknownHex,
  );
  configureShadowedSprite(
    marker,
    0xe2e8f0,
    enemyIconSize,
    enemyIconSize,
    1,
    shadowOffset,
    point,
  );
  return;
}
```

- [ ] **Step 4: Run the targeted render and interaction verification**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldClickNavigation.test.ts src/ui/world/worldIcons.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/ui/world/renderSceneInteractions.test.ts src/app/App/tests/App.worldInteractionPerformance.test.tsx
pnpm --filter @realmfall/client typecheck
```

Expected:

- Unknown-hex interaction and render suites pass.
- The performance suite keeps asserting that hover and click avoid synchronous tile generation.
- Typecheck passes with the new visible-tile union flowing through the Pixi renderer.

### Task 6: Remove Remaining UI-Side Sync Tile Fallbacks, Update Specs, And Run Full Verification

**Files:**

- Modify: `packages/client/src/app/App/hooks/useHexGameplayView.ts`
- Modify: `packages/client/src/ui/world/renderSceneClaimBorders.ts`
- Modify: `docs/specs/reference/gameplay-features/world-exploration/spec.md`
- Modify: `docs/specs/reference/technical-solutions/deterministic-world-generation/spec.md`
- Create: `docs/specs/reference/technical-solutions/async-world-tile-resolution/spec.md`
- Modify: `docs/specs/reference/technical-solutions/README.md`

- [ ] **Step 1: Add the final failing tests for remaining UI-side sync fallback paths**

Extend `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx` with:

```ts
it('does not resolve current hex info by building missing visible tiles', async () => {
  const game = createGame(3, 'hex-info-no-sync-build');
  game.player.coord = { q: 1, r: 0 };
  delete game.tiles['1,0'];
  loadEncryptedState.mockResolvedValue({ game, ui: {} });

  const worldModule = await import('../../../game/world');
  const buildTileSpy = vi.spyOn(worldModule, 'buildTile');

  const { root } = await renderApp();
  await flushLazyModules();

  expect(buildTileSpy).not.toHaveBeenCalled();

  await act(async () => {
    root.unmount();
  });

  buildTileSpy.mockRestore();
});
```

- [ ] **Step 2: Run the final targeted suite to verify it fails**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx
```

Expected: FAIL because current hex view and claim-border logic fall back to `buildTile(...)`.

- [ ] **Step 3: Remove the remaining UI-side sync fallbacks and update the canonical specs**

Update `packages/client/src/app/App/hooks/useHexGameplayView.ts` so the current tile reads only resolved state:

```ts
import { getResolvedTileAt } from '../../../game/stateWorldQueries';

const currentTile = useMemo(
  () =>
    getResolvedTileAt({ tiles }, coord) ?? {
      coord,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    },
  [coord, tiles],
);
```

Update `packages/client/src/ui/world/renderSceneClaimBorders.ts`:

```ts
function resolveNeighborClaim(
  state: GameState,
  visibleTileMap: Map<string, Tile>,
  coord: HexCoord,
) {
  const key = hexKey(coord);
  return visibleTileMap.get(key)?.claim ?? state.tiles[key]?.claim;
}
```

Create `docs/specs/reference/technical-solutions/async-world-tile-resolution/spec.md`:

```md
# Async World Tile Resolution

## Scope

This spec covers the worker-first request/response pipeline that resolves visible world tiles outside the main thread.

## Current Solution

- `GameState.tiles` stores only resolved tiles and remains the canonical gameplay source.
- The client computes the visible ring around the player and requests missing coords in batches through a `TileResolutionSource`.
- The first `TileResolutionSource` implementation uses a Vite module worker built on `easy-web-worker`.
- Stale frontier requests are canceled through `easy-cancelable-promise`, and late responses are ignored by request id.
- Visible unresolved coords render as unknown placeholders with the random-dice icon and no terrain background until their payload resolves.
- Worker failure falls back to a local synchronous source behind the same interface so the game remains playable.

## Main Implementation Areas

- `src/app/App/world/tileResolution/*`
- `src/ui/world/visibleWorldTiles.ts`
- `src/app/App/usePixiWorld.ts`
- `src/game/worldTileResolutionPayloads.ts`
```

Add this bullet to `docs/specs/reference/gameplay-features/world-exploration/spec.md` under `Current Behavior`:

```md
- Missing visible frontier hexes appear immediately as unknown placeholders, cannot be entered or pathfound through until resolved, and each successful movement step advances in-game time by `1000 ms`.
```

Add this bullet to `docs/specs/reference/technical-solutions/deterministic-world-generation/spec.md` under `Current Solution`:

```md
- Deterministic tile assembly is reused by the visible-world tile-resolution pipeline through a pure payload builder that returns serializable tile and enemy batches for worker or fallback sources.
```

Add this entry to `docs/specs/reference/technical-solutions/README.md`:

```md
- [Async World Tile Resolution](./async-world-tile-resolution/spec.md)
```

- [ ] **Step 4: Run the full repository verification pass**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:jsdom
pnpm build:budget:strict
```

Expected:

- Workspace typecheck passes across `common`, `server`, `ui`, and `client`.
- Lint passes for TypeScript and SCSS.
- Node and jsdom suites pass for gameplay, worker coordination, and Pixi rendering.
- The strict bundle-budget build passes with the worker integration kept off the initial bootstrap path.
