# Movement Cooldown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-hex movement time advancement with a real-time, server-shaped movement cooldown that moves one resolved hex per approved request, auto-continues safe paths across cooldown windows, and renders a yellow cooldown indicator under the player icon.

**Architecture:** Keep deterministic movement approval effects in `packages/client/src/game`, but move transport-like cooldown state into a client movement controller in the App world layer. The world view requests one adjacent step at a time through a shared move contract, applies approved steps immediately, waits `moveHexCooldownMs` in real time before the next request, and renders cooldown progress from wall-clock time without persisting it.

**Tech Stack:** TypeScript, React 19, Pixi.js 8, Vitest (`node` and `jsdom` projects), `@realmfall/common`, `pnpm`

---

## File Structure

- `packages/common/src/worldMovement.ts`
  Shared request/response contract for one-step movement. Future server code can import this unchanged.
- `packages/common/src/index.ts`
  Re-export the movement contract from the common package root.
- `packages/client/game.config.ts`
  Rename the movement config key to `moveHexCooldownMs` and keep the default at `1000`.
- `packages/client/src/game/gameConfigSchema.ts`
  Update the typed config shape to the new cooldown property name.
- `packages/client/src/game/gameConfigSchema.test.ts`
  Lock the renamed config property into the schema surface.
- `packages/client/src/game/config.ts`
  Rename the exported movement constant to a cooldown-oriented name.
- `packages/client/src/game/stateMovement.ts`
  Keep `moveToTile` as approved-step application only. Remove movement-driven `worldTimeMs` advancement and retire batch safe-path execution from gameplay state.
- `packages/client/src/game/state.ts`
  Stop exporting `moveAlongSafePath` if it becomes dead after the controller cutover.
- `packages/client/src/game/stateExploration.test.ts`
  Replace world-time expectations with cooldown-era behavior expectations and keep unresolved-path coverage.
- `packages/client/src/app/App/world/movement/worldMoveSource.ts`
  Client interface for a one-step move request source.
- `packages/client/src/app/App/world/movement/createLocalWorldMoveSource.ts`
  Local implementation that returns `ok` or `remainingCooldownMs` in the same shape as a future server.
- `packages/client/src/app/App/world/movement/worldMovementController.ts`
  Movement session controller that owns the queued path, cooldown deadline, retry timer, and approved-step application callback.
- `packages/client/src/app/App/world/movement/createLocalWorldMoveSource.test.ts`
  Node tests for local source cooldown responses.
- `packages/client/src/app/App/world/movement/worldMovementController.test.ts`
  Node tests for auto-continue, denial retry, and destination replacement.
- `packages/client/src/app/App/usePixiWorld.ts`
  Create and dispose the movement controller, keep cooldown state in refs, and clear queued movement on external stop conditions.
- `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`
  Turn clicks into queued adjacent steps instead of direct synchronous movement.
- `packages/client/src/app/App/world/pixiWorldInteractions.ts`
  Thread the movement controller through the click handler wiring.
- `packages/client/src/app/App/world/pixiWorldBootstrap.ts`
  Pass movement cooldown refs into the render loop and interaction bootstrap.
- `packages/client/src/app/App/world/pixiWorldRenderLoop.ts`
  Include cooldown render state in the frame snapshot and render-scene options.
- `packages/client/src/app/App/world/worldRenderSnapshot.ts`
  Snapshot cooldown render inputs so render invalidation stays deterministic.
- `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`
  Verify adjacent and safe-path clicks enqueue movement through the controller instead of mutating `GameState` directly.
- `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`
  Keep the “ignore unrevealed distant clicks” guard after the movement routing refactor.
- `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx`
  Jsdom integration test for one-hex-per-cooldown auto-continue and path replacement during cooldown.
- `packages/client/src/ui/world/renderScene.ts`
  Accept cooldown render input and forward it to animated/player-layer rendering.
- `packages/client/src/ui/world/renderSceneAnimated.ts`
  Draw the yellow cooldown indicator under the player marker from wall-clock progress.
- `packages/client/src/ui/world/renderSceneCache.ts`
  Add a dedicated player cooldown graphics pool or layer under the player marker.
- `packages/client/src/ui/world/renderSceneTestHelpers.ts`
  Add helper access for the player layer if the new render test needs it.
- `packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts`
  Verify cooldown render state reaches `renderScene` and retriggers when it changes.
- `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
  Verify the yellow indicator appears under the player during cooldown and disappears after expiry.
- `docs/specs/reference/gameplay-features/world-exploration/spec.md`
  Update shipped behavior wording from “movement advances world time” to “movement uses real-time cooldown.”
- `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
  Add the permanent technical-solution spec for the movement controller boundary.
- `docs/specs/reference/technical-solutions/README.md`
  Link the new technical-solution spec.

### Task 1: Rename Config And Add Shared Movement Contract

**Files:**

- Create: `packages/common/src/worldMovement.ts`
- Modify: `packages/common/src/index.ts`
- Modify: `packages/client/game.config.ts`
- Modify: `packages/client/src/game/gameConfigSchema.ts`
- Modify: `packages/client/src/game/gameConfigSchema.test.ts`
- Modify: `packages/client/src/game/config.ts`
- Test: `packages/client/src/game/gameConfigSchema.test.ts`

- [ ] **Step 1: Write the failing config/schema test**

```ts
// packages/client/src/game/gameConfigSchema.test.ts
// In the existing sampleConfig object literal, rename the worldClock fragment to:
worldClock: {
  dayDurationMs: 1,
  moveHexCooldownMs: 1,
},

it('exposes the movement cooldown config through the runtime surface', () => {
  expect(GAME_CONFIG.worldClock.moveHexCooldownMs).toBe(
    rawGameConfig.worldClock.moveHexCooldownMs,
  );
});
```

- [ ] **Step 2: Run the targeted failing test**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/gameConfigSchema.test.ts
```

Expected: FAIL because `moveHexCooldownMs` does not exist in the schema or runtime config surface yet.

- [ ] **Step 3: Write the minimal shared contract and config rename**

```ts
// packages/common/src/worldMovement.ts
export interface WorldMoveRequest {
  requestId: string;
  target: {
    q: number;
    r: number;
  };
}

export type WorldMoveResponse =
  | {
      ok: true;
      cooldownMs: number;
    }
  | {
      ok: false;
      remainingCooldownMs: number;
    };
```

```ts
// packages/common/src/index.ts
export * from './worldTileResolution';
export * from './worldMovement';
```

```ts
// packages/client/src/game/gameConfigSchema.ts
worldClock: {
  dayDurationMs: number;
  moveHexCooldownMs: number;
}
```

```ts
// packages/client/src/game/config.ts
export const WORLD_MOVE_HEX_COOLDOWN_MS =
  GAME_CONFIG.worldClock.moveHexCooldownMs;
```

```ts
// packages/client/game.config.ts
worldClock: {
  dayDurationMs: 5 * 60_000,
  moveHexCooldownMs: 1_000,
},
```

- [ ] **Step 4: Re-run the targeted test and common typecheck**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/gameConfigSchema.test.ts
pnpm --filter @realmfall/common typecheck
```

Expected: PASS for the test file and no TypeScript errors in `@realmfall/common`.

- [ ] **Step 5: Commit**

```bash
git add packages/common/src/worldMovement.ts packages/common/src/index.ts packages/client/game.config.ts packages/client/src/game/gameConfigSchema.ts packages/client/src/game/gameConfigSchema.test.ts packages/client/src/game/config.ts
pnpm git:commit -- -m "refactor: rename movement cooldown config"
```

### Task 2: Decouple Movement From World Time

**Files:**

- Modify: `packages/client/src/game/stateMovement.ts`
- Modify: `packages/client/src/game/state.ts`
- Modify: `packages/client/src/game/stateExploration.test.ts`
- Test: `packages/client/src/game/stateExploration.test.ts`

- [ ] **Step 1: Write the failing gameplay tests**

```ts
// packages/client/src/game/stateExploration.test.ts
it('moves to a resolved adjacent tile without advancing worldTimeMs', () => {
  const game = createGame(3, 'move-without-world-time');
  game.worldTimeMs = 12_345;
  game.player.coord = { q: 1, r: 0 };
  game.tiles['2,0'] = {
    coord: { q: 2, r: 0 },
    terrain: 'plains',
    items: [],
    enemyIds: [],
  };

  const next = moveToTile(game, { q: 2, r: 0 });

  expect(next.player.coord).toEqual({ q: 2, r: 0 });
  expect(next.turn).toBe(1);
  expect(next.worldTimeMs).toBe(12_345);
  expect(next.dayPhase).toBe(game.dayPhase);
});

it('can still follow a computed safe path through repeated approved steps', () => {
  const game = createGame(4, 'repeat-approved-steps');
  game.worldTimeMs = 12_345;

  game.tiles['1,0'] = {
    coord: { q: 1, r: 0 },
    terrain: 'mountain',
    items: [],
    enemyIds: [],
  };
  game.tiles['1,-1'] = {
    coord: { q: 1, r: -1 },
    terrain: 'plains',
    items: [],
    enemyIds: [],
  };
  game.tiles['2,-1'] = {
    coord: { q: 2, r: -1 },
    terrain: 'plains',
    items: [],
    enemyIds: [],
  };
  game.tiles['2,0'] = {
    coord: { q: 2, r: 0 },
    terrain: 'plains',
    items: [],
    enemyIds: [],
  };

  const path = getSafePathToTile(game, { q: 2, r: 0 })!;
  const moved = path.reduce((next, step) => moveToTile(next, step), game);

  expect(moved.player.coord).toEqual({ q: 2, r: 0 });
  expect(moved.turn).toBe(3);
  expect(moved.worldTimeMs).toBe(12_345);
});
```

- [ ] **Step 2: Run the targeted failing gameplay test**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateExploration.test.ts
```

Expected: FAIL because `moveToTile` still advances `worldTimeMs` and old tests still depend on `moveAlongSafePath`.

- [ ] **Step 3: Write the minimal gameplay implementation**

```ts
// packages/client/src/game/stateMovement.ts
import { applySurvivalDecay, respawnAtNearestTown } from './stateSurvival';

export function moveToTile(state: GameState, target: HexCoord): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const current = state.player.coord;
  if (hexDistance(current, target) !== 1) {
    return message(state, t('game.message.travel.oneHexAtATime'));
  }

  const next = cloneForWorldMutation(state);
  const tile = getResolvedTileAt(next, target);
  if (!tile) {
    return message(next, t('game.message.travel.unknownHex'));
  }

  if (!isPassable(tile.terrain)) {
    return message(next, t('game.message.travel.blockedTerrain'));
  }

  next.turn += 1;
  applySurvivalDecay(next);
  next.player.coord = target;

  // keep respawn, ambush, hostile encounter, and movement log behavior
}
```

```ts
// packages/client/src/game/state.ts
export { moveToTile } from './stateMovement';
```

```ts
// packages/client/src/game/stateExploration.test.ts
import {
  createGame,
  getRecipeBookRecipes,
  getSafePathToTile,
  getTileAt,
  getVisibleTiles,
  moveToTile,
} from './state';
```

- [ ] **Step 4: Re-run the targeted gameplay test**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateExploration.test.ts
```

Expected: PASS with no expectations tied to movement advancing `worldTimeMs`.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/game/stateMovement.ts packages/client/src/game/state.ts packages/client/src/game/stateExploration.test.ts
pnpm git:commit -- -m "refactor: decouple movement from world time"
```

### Task 3: Add The Local Move Source And Movement Controller

**Files:**

- Create: `packages/client/src/app/App/world/movement/worldMoveSource.ts`
- Create: `packages/client/src/app/App/world/movement/createLocalWorldMoveSource.ts`
- Create: `packages/client/src/app/App/world/movement/worldMovementController.ts`
- Create: `packages/client/src/app/App/world/movement/createLocalWorldMoveSource.test.ts`
- Create: `packages/client/src/app/App/world/movement/worldMovementController.test.ts`
- Test: `packages/client/src/app/App/world/movement/createLocalWorldMoveSource.test.ts`
- Test: `packages/client/src/app/App/world/movement/worldMovementController.test.ts`

- [ ] **Step 1: Write the failing controller/source tests**

```ts
// packages/client/src/app/App/world/movement/createLocalWorldMoveSource.test.ts
it('returns remaining cooldown when a step is requested too early', async () => {
  let now = 1_000;
  const source = createLocalWorldMoveSource({
    cooldownMs: 1_000,
    now: () => now,
  });

  await expect(
    source.requestMove({
      requestId: 'first',
      target: { q: 1, r: 0 },
    }),
  ).resolves.toEqual({ ok: true, cooldownMs: 1_000 });

  now = 1_250;
  await expect(
    source.requestMove({
      requestId: 'second',
      target: { q: 2, r: 0 },
    }),
  ).resolves.toEqual({ ok: false, remainingCooldownMs: 750 });
});
```

```ts
// packages/client/src/app/App/world/movement/worldMovementController.test.ts
it('auto-continues one approved step per cooldown window', async () => {
  vi.useFakeTimers();
  let now = 0;
  const appliedSteps: HexCoord[] = [];
  const requestMove = vi
    .fn<WorldMoveSource['requestMove']>()
    .mockResolvedValue({ ok: true, cooldownMs: 1_000 });

  const controller = createWorldMovementController({
    moveSource: { requestMove },
    now: () => now,
    schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearScheduled: (timerId) => window.clearTimeout(timerId),
    applyApprovedStep: (step) => {
      appliedSteps.push(step);
      now += 1;
    },
    onCooldownChange: vi.fn(),
  });

  controller.replaceQueuedPath([
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]);
  await vi.runAllTicks();
  expect(appliedSteps).toEqual([{ q: 1, r: 0 }]);

  await vi.advanceTimersByTimeAsync(1_000);
  expect(appliedSteps).toEqual([
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]);
});

it('replaces queued continuation during cooldown without canceling the active cooldown', async () => {
  vi.useFakeTimers();
  const requestMove = vi
    .fn<WorldMoveSource['requestMove']>()
    .mockResolvedValue({ ok: true, cooldownMs: 1_000 });
  const requestedTargets: HexCoord[] = [];

  const controller = createWorldMovementController({
    moveSource: {
      requestMove: async (request) => {
        requestedTargets.push(request.target);
        return requestMove(request);
      },
    },
    now: () => 0,
    schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearScheduled: (timerId) => window.clearTimeout(timerId),
    applyApprovedStep: vi.fn(),
    onCooldownChange: vi.fn(),
  });

  controller.replaceQueuedPath([
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]);
  await vi.runAllTicks();
  controller.replaceQueuedPath([{ q: 1, r: -1 }]);

  await vi.advanceTimersByTimeAsync(1_000);
  expect(requestedTargets).toEqual([
    { q: 1, r: 0 },
    { q: 1, r: -1 },
  ]);
});

it('stops queued travel after an external reposition makes the next step non-adjacent', async () => {
  vi.useFakeTimers();
  let currentCoord: HexCoord = { q: 0, r: 0 };
  const requestMove = vi
    .fn<WorldMoveSource['requestMove']>()
    .mockResolvedValue({ ok: true, cooldownMs: 1_000 });

  const controller = createWorldMovementController({
    moveSource: { requestMove },
    now: () => 0,
    getCurrentCoord: () => currentCoord,
    schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearScheduled: (timerId) => window.clearTimeout(timerId),
    applyApprovedStep: () => {
      currentCoord = { q: 1, r: 0 };
    },
    onCooldownChange: vi.fn(),
  });

  controller.replaceQueuedPath([
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]);
  await vi.runAllTicks();

  currentCoord = { q: 5, r: 5 };
  await vi.advanceTimersByTimeAsync(1_000);

  expect(requestMove).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the targeted failing tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/movement/createLocalWorldMoveSource.test.ts src/app/App/world/movement/worldMovementController.test.ts
```

Expected: FAIL because the new movement source/controller files do not exist yet.

- [ ] **Step 3: Write the minimal controller/source implementation**

```ts
// packages/client/src/app/App/world/movement/worldMoveSource.ts
import type { WorldMoveRequest, WorldMoveResponse } from '@realmfall/common';

export interface WorldMoveSource {
  requestMove(request: WorldMoveRequest): Promise<WorldMoveResponse>;
}
```

```ts
// packages/client/src/app/App/world/movement/createLocalWorldMoveSource.ts
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../../../game/config';

export function createLocalWorldMoveSource({
  cooldownMs = WORLD_MOVE_HEX_COOLDOWN_MS,
  now = () => performance.now(),
}: {
  cooldownMs?: number;
  now?: () => number;
} = {}): WorldMoveSource {
  let cooldownEndAtMs = 0;

  return {
    async requestMove() {
      const remainingCooldownMs = Math.max(0, cooldownEndAtMs - now());
      if (remainingCooldownMs > 0) {
        return { ok: false, remainingCooldownMs };
      }

      cooldownEndAtMs = now() + cooldownMs;
      return { ok: true, cooldownMs };
    },
  };
}
```

```ts
// packages/client/src/app/App/world/movement/worldMovementController.ts
export function createWorldMovementController({
  moveSource,
  now,
  getCurrentCoord,
  schedule,
  clearScheduled,
  applyApprovedStep,
  onCooldownChange,
}: {
  moveSource: WorldMoveSource;
  now: () => number;
  getCurrentCoord: () => HexCoord;
  schedule: (callback: () => void, delayMs: number) => number;
  clearScheduled: (timerId: number) => void;
  applyApprovedStep: (step: HexCoord) => void;
  onCooldownChange: (endAtMs: number | null) => void;
}) {
  let queuedSteps: HexCoord[] = [];
  let cooldownEndAtMs: number | null = null;
  let retryTimer: number | null = null;
  let requestSequence = 0;

  const clearRetryTimer = () => {
    if (retryTimer !== null) {
      clearScheduled(retryTimer);
      retryTimer = null;
    }
  };

  const scheduleRetry = (delayMs: number) => {
    clearRetryTimer();
    retryTimer = schedule(() => {
      retryTimer = null;
      void requestNextStep();
    }, delayMs);
  };

  const requestNextStep = async () => {
    const nextStep = queuedSteps[0];
    if (!nextStep) {
      cooldownEndAtMs = null;
      onCooldownChange(null);
      return;
    }

    if (hexDistance(getCurrentCoord(), nextStep) !== 1) {
      queuedSteps = [];
      cooldownEndAtMs = null;
      onCooldownChange(null);
      clearRetryTimer();
      return;
    }

    const response = await moveSource.requestMove({
      requestId: `world-move-${(requestSequence += 1)}`,
      target: nextStep,
    });

    if (!response.ok) {
      cooldownEndAtMs = now() + response.remainingCooldownMs;
      onCooldownChange(cooldownEndAtMs);
      scheduleRetry(response.remainingCooldownMs);
      return;
    }

    applyApprovedStep(nextStep);
    queuedSteps = queuedSteps.slice(1);
    cooldownEndAtMs = now() + response.cooldownMs;
    onCooldownChange(cooldownEndAtMs);
    if (queuedSteps.length > 0) {
      scheduleRetry(response.cooldownMs);
    }
  };

  return {
    clear() {
      queuedSteps = [];
      cooldownEndAtMs = null;
      onCooldownChange(null);
      clearRetryTimer();
    },
    getCooldownEndAtMs() {
      return cooldownEndAtMs;
    },
    replaceQueuedPath(nextSteps: HexCoord[]) {
      queuedSteps = [...nextSteps];
      if ((cooldownEndAtMs ?? 0) > now()) {
        return;
      }

      void requestNextStep();
    },
    dispose() {
      clearRetryTimer();
      queuedSteps = [];
    },
  };
}
```

- [ ] **Step 4: Re-run the targeted controller/source tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/movement/createLocalWorldMoveSource.test.ts src/app/App/world/movement/worldMovementController.test.ts
```

Expected: PASS with one-step approval, denial retry, and queue replacement covered in node tests.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/app/App/world/movement/worldMoveSource.ts packages/client/src/app/App/world/movement/createLocalWorldMoveSource.ts packages/client/src/app/App/world/movement/worldMovementController.ts packages/client/src/app/App/world/movement/createLocalWorldMoveSource.test.ts packages/client/src/app/App/world/movement/worldMovementController.test.ts
pnpm git:commit -- -m "feat: add movement cooldown controller"
```

### Task 4: Wire Click Navigation Through The Movement Controller

**Files:**

- Modify: `packages/client/src/app/App/usePixiWorld.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldInteractions.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldBootstrap.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`
- Modify: `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`
- Create: `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx`
- Test: `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`
- Test: `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`
- Test: `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx`

- [ ] **Step 1: Write the failing click-routing and app cooldown tests**

```ts
// packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts
it('queues an adjacent click through the movement controller', () => {
  const replaceQueuedPath = vi.fn();
  const handleClick = createWorldClickHandler({
    app: app as never,
    gameRef: { current: game },
    getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    setGame: vi.fn(),
    worldTimeMsRef: { current: game.worldTimeMs },
    movementController: { replaceQueuedPath } as never,
  });

  handleClick(320, 240);

  expect(replaceQueuedPath).toHaveBeenCalledWith([{ q: 1, r: 0 }]);
});

it('queues the resolved safe path instead of applying movement immediately', () => {
  const replaceQueuedPath = vi.fn();
  const handleClick = createWorldClickHandler({
    app: app as never,
    gameRef: { current: game },
    getScenePoint: () => ({ x: safePathPoint.x, y: safePathPoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    setGame: vi.fn(),
    worldTimeMsRef: { current: game.worldTimeMs },
    movementController: { replaceQueuedPath } as never,
  });

  handleClick(320, 240);

  expect(replaceQueuedPath).toHaveBeenCalledWith([
    { q: 1, r: -1 },
    { q: 2, r: -1 },
    { q: 2, r: 0 },
  ]);
});
```

```ts
// packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx
it('moves one resolved hex per cooldown window and replaces queued travel during cooldown', async () => {
  const game = createGame(3, 'app-movement-cooldown');
  loadEncryptedState.mockResolvedValue({ game, ui: {} });

  const { host, root } = await renderApp();
  await flushLazyModules();

  const canvas = host.querySelector('canvas');
  expect(canvas).not.toBeNull();

  await act(async () => {
    canvas?.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        clientX: 480,
        clientY: 240,
      }),
    );
    canvas?.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        clientX: 480,
        clientY: 240,
      }),
    );
  });

  const firstFrameGame = renderScene.mock.calls.at(-1)?.[1] as GameState;
  expect(firstFrameGame.player.coord).toEqual({ q: 1, r: 0 });

  await act(async () => {
    vi.advanceTimersByTime(1_000);
    await Promise.resolve();
  });

  const secondFrameGame = renderScene.mock.calls.at(-1)?.[1] as GameState;
  expect(secondFrameGame.player.coord).toEqual({ q: 2, r: 0 });

  await act(async () => {
    root.unmount();
  });
  host.remove();
});
```

- [ ] **Step 2: Run the targeted failing jsdom and node tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldClickNavigation.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx src/app/App/tests/App.worldMovementCooldown.test.tsx
```

Expected: FAIL because the click handler still mutates game state directly and no movement controller is threaded through the App world bootstrap.

- [ ] **Step 3: Write the minimal click/controller wiring**

```ts
// packages/client/src/app/App/world/pixiWorldClickNavigation.ts
export function createWorldClickHandler({
  app,
  gameRef,
  getScenePoint,
  pausedRef,
  playerCoordRef,
  renderInvalidationRef,
  selectedRef,
  setGame,
  worldTimeMsRef,
  movementController,
}: {
  app: Application;
  gameRef: MutableRefObject<GameState>;
  getScenePoint: WorldScenePointMapper;
  pausedRef: MutableRefObject<boolean>;
  playerCoordRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  selectedRef: MutableRefObject<HexCoord>;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
  movementController: {
    replaceQueuedPath(nextSteps: HexCoord[]): void;
  };
}) {
  return (clientX: number, clientY: number) => {
    if (pausedRef.current) {
      return;
    }

    const scenePoint = getScenePoint(clientX, clientY);
    const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
    const clickedOffset = hexAtPoint(scenePoint.x, scenePoint.y, {
      centerX: app.screen.width / 2,
      centerY: app.screen.height / 2,
      size: hexSize,
    });
    const target = {
      q: playerCoordRef.current.q + clickedOffset.q,
      r: playerCoordRef.current.r + clickedOffset.r,
    };
    const current = gameRef.current;
    const distance = hexDistance(playerCoordRef.current, target);

    if (distance === 1) {
      const tile = getResolvedTileAt(current, target);
      if (!tile || !isPassable(tile.terrain)) {
        return;
      }

      selectedRef.current = target;
      renderInvalidationRef.current += 1;
      movementController.replaceQueuedPath([target]);
      return;
    }

    const safePath = getSafePathToTile(current, target);
    if (!safePath) {
      return;
    }

    selectedRef.current = target;
    renderInvalidationRef.current += 1;
    movementController.replaceQueuedPath(safePath);
  };
}
```

```ts
// packages/client/src/app/App/usePixiWorld.ts
const movementCooldownEndAtRef = useRef<number | null>(null);
const movementControllerRef = useRef<ReturnType<
  typeof import('./world/movement/worldMovementController').createWorldMovementController
> | null>(null);

// after the world is enabled
const [{ createLocalWorldMoveSource }, { createWorldMovementController }] =
  await Promise.all([
    import('./world/movement/createLocalWorldMoveSource'),
    import('./world/movement/worldMovementController'),
  ]);

movementControllerRef.current = createWorldMovementController({
  moveSource: createLocalWorldMoveSource(),
  now: () => performance.now(),
  getCurrentCoord: () => gameRef.current.player.coord,
  schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearScheduled: (timerId) => window.clearTimeout(timerId),
  applyApprovedStep: (target) => {
    setGame((currentState) => {
      const nextState = createLoggedGameTransition({
        describe: () => t('game.log.command.moveToTile'),
        transition: (timedState) => moveToTile(timedState, target),
      })({
        ...currentState,
        worldTimeMs: worldTimeMsRef.current,
      });
      gameRef.current = nextState;
      worldTimeMsRef.current = nextState.worldTimeMs;
      return nextState;
    });
  },
  onCooldownChange: (endAtMs) => {
    movementCooldownEndAtRef.current = endAtMs;
    renderInvalidationRef.current += 1;
  },
});
```

```ts
// packages/client/src/app/App/usePixiWorld.ts
useEffect(() => {
  if (game.combat) {
    movementControllerRef.current?.clear();
  }
}, [game.combat]);
```

- [ ] **Step 4: Re-run the targeted click/app tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldClickNavigation.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx src/app/App/tests/App.worldMovementCooldown.test.tsx
```

Expected: PASS with click routing, ignored unrevealed clicks, and one-step-per-cooldown app behavior covered.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/app/App/usePixiWorld.ts packages/client/src/app/App/world/pixiWorldClickNavigation.ts packages/client/src/app/App/world/pixiWorldInteractions.ts packages/client/src/app/App/world/pixiWorldBootstrap.ts packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx
pnpm git:commit -- -m "feat: queue world movement through cooldown requests"
```

### Task 5: Render The Yellow Cooldown Indicator Under The Player

**Files:**

- Modify: `packages/client/src/app/App/world/worldRenderSnapshot.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldRenderLoop.ts`
- Modify: `packages/client/src/ui/world/renderScene.ts`
- Modify: `packages/client/src/ui/world/renderSceneAnimated.ts`
- Modify: `packages/client/src/ui/world/renderSceneCache.ts`
- Modify: `packages/client/src/ui/world/renderSceneTestHelpers.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts`
- Create: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
- Test: `packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts`
- Test: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`

- [ ] **Step 1: Write the failing render-loop and scene tests**

```ts
// packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts
it('re-renders when the player movement cooldown changes', () => {
  const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(500);
  const renderScene = vi.fn();
  const movementCooldownEndAtRef = { current: null as number | null };
  const renderFrame = createWorldRenderFrame({
    app: {} as never,
    renderScene,
    gameRef: { current: { player: { coord: { q: 0, r: 0 } } } } as never,
    visibleTilesRef: {
      current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
    } as never,
    selectedRef: { current: { q: 0, r: 0 } } as never,
    hoveredMoveRef: { current: null },
    hoveredSafePathRef: { current: null },
    showTerrainBackgroundsRef: { current: true },
    worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
    pausedRef: { current: false },
    pausedAnimationMsRef: { current: null },
    worldTimeMsRef: { current: 0 },
    renderInvalidationRef: { current: 0 },
    lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    movementCooldownEndAtRef,
  });

  renderFrame();
  movementCooldownEndAtRef.current = 1_500;
  renderFrame();

  expect(renderScene).toHaveBeenCalledTimes(2);
  expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
    movementCooldown: {
      endAtMs: 1_500,
    },
  });

  performanceNowSpy.mockRestore();
});
```

```ts
// packages/client/src/ui/world/renderSceneMovementCooldown.test.ts
it('draws a yellow cooldown bar under the player while movement cooldown remains active', async () => {
  const { renderScene } = await import('./renderScene');
  const app = createMockApp();
  const game = createGame(2, 'render-scene-move-cooldown');

  renderScene(
    app as never,
    game,
    [game.tiles[hexKey(game.player.coord)]!],
    game.player.coord,
    null,
    12 * 60,
    250,
    null,
    {
      movementCooldown: {
        durationMs: 1_000,
        endAtMs: 1_000,
      },
    },
  );

  const playerLayer = getPlayerLayer(app);
  const cooldownGraphics = collectDescendants(playerLayer).filter(
    (child): child is MockGraphics => child instanceof MockGraphics,
  );

  expect(
    cooldownGraphics.some((graphic) =>
      graphic.beginFill.mock.calls.some(([color]) => color === 0xfacc15),
    ),
  ).toBe(true);
});
```

- [ ] **Step 2: Run the targeted failing render tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldRenderLoop.test.ts
pnpm --filter @realmfall/client exec vitest run --project node src/ui/world/renderSceneMovementCooldown.test.ts
```

Expected: FAIL because no cooldown render input exists yet and the player layer has no cooldown graphics.

- [ ] **Step 3: Write the minimal render implementation**

```ts
// packages/client/src/app/App/world/worldRenderSnapshot.ts
export interface WorldRenderSnapshot {
  movementCooldownEndAtMs: number | null;
}

export function createInitialWorldRenderSnapshot(): WorldRenderSnapshot {
  return {
    movementCooldownEndAtMs: null,
  };
}
```

```ts
// packages/client/src/app/App/world/pixiWorldRenderLoop.ts
const movementCooldownEndAtMs = movementCooldownEndAtRef.current;

// Add this comparison to the existing render-snapshot equality guard:
lastRenderSnapshot.movementCooldownEndAtMs === movementCooldownEndAtMs &&
  renderScene(
    app,
    currentGame,
    currentVisibleTiles,
    currentSelected,
    currentHoveredMove,
    getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
    animationBucket * worldRenderFrameMs,
    currentHoveredSafePath,
    {
      showTerrainBackgrounds,
      worldRenderFps,
      movementCooldown:
        movementCooldownEndAtMs == null
          ? null
          : {
              durationMs: WORLD_MOVE_HEX_COOLDOWN_MS,
              endAtMs: movementCooldownEndAtMs,
            },
    },
  );
```

```ts
// packages/client/src/ui/world/renderSceneCache.ts
const worldPlayer = new Container();
const playerCooldown = new Container();

worldPlayer.addChild(playerCooldown, player.wrapper);

// Add this field inside the existing SceneCache object literal:
playerCooldownGraphics: createGraphicsPool(playerCooldown),
```

```ts
// packages/client/src/ui/world/renderSceneAnimated.ts
function renderPlayerMovementCooldown({
  scene,
  origin,
  playerIconSize,
  movementCooldown,
  animationMs,
}: {
  scene: SceneCache;
  origin: { x: number; y: number };
  playerIconSize: number;
  movementCooldown: { durationMs: number; endAtMs: number } | null;
  animationMs: number;
}) {
  if (!movementCooldown) {
    return;
  }

  const remainingMs = Math.max(0, movementCooldown.endAtMs - animationMs);
  if (remainingMs <= 0) {
    return;
  }

  const progress = remainingMs / movementCooldown.durationMs;
  const background = scene.playerCooldownGraphics.next();
  background
    .rect(
      origin.x - playerIconSize * 0.45,
      origin.y + playerIconSize * 0.46,
      playerIconSize * 0.9,
      playerIconSize * 0.12,
    )
    .fill({ color: 0x422006, alpha: 0.85 });

  const fill = scene.playerCooldownGraphics.next();
  fill
    .rect(
      origin.x - playerIconSize * 0.45,
      origin.y + playerIconSize * 0.46,
      playerIconSize * 0.9 * progress,
      playerIconSize * 0.12,
    )
    .fill({ color: 0xfacc15, alpha: 0.95 });
}
```

- [ ] **Step 4: Re-run the targeted render tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldRenderLoop.test.ts
pnpm --filter @realmfall/client exec vitest run --project node src/ui/world/renderSceneMovementCooldown.test.ts
```

Expected: PASS with cooldown render input propagation and yellow player-underlay rendering covered.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/app/App/world/worldRenderSnapshot.ts packages/client/src/app/App/world/pixiWorldRenderLoop.ts packages/client/src/ui/world/renderScene.ts packages/client/src/ui/world/renderSceneAnimated.ts packages/client/src/ui/world/renderSceneCache.ts packages/client/src/ui/world/renderSceneTestHelpers.ts packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts packages/client/src/ui/world/renderSceneMovementCooldown.test.ts
pnpm git:commit -- -m "feat: render movement cooldown under player"
```

### Task 6: Update Permanent Specs And Run Full Verification

**Files:**

- Modify: `docs/specs/reference/gameplay-features/world-exploration/spec.md`
- Create: `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
- Modify: `docs/specs/reference/technical-solutions/README.md`

- [ ] **Step 1: Update the shipped-behavior docs**

```md
<!-- docs/specs/reference/gameplay-features/world-exploration/spec.md -->

- Missing visible frontier hexes appear immediately as unknown placeholders, cannot be entered or pathfound through until resolved, and each successful movement step starts a real-time `1000 ms` cooldown before the next approved step.
- Safe-path travel auto-continues one resolved hex at a time across cooldown windows and does not advance `worldTimeMs`.
```

```md
<!-- docs/specs/reference/technical-solutions/movement-cooldown/spec.md -->

# Movement Cooldown

## Scope

This spec covers the client-side movement request boundary, cooldown queueing, and Pixi cooldown rendering.

## Current Behavior

- World movement uses a one-step request/response contract shared through `@realmfall/common`.
- The local move source returns either `ok: true` with `cooldownMs` or `ok: false` with `remainingCooldownMs`.
- The App world layer owns queued movement, cooldown deadline, and retry scheduling.
- Approved steps apply through `moveToTile` immediately and never advance `worldTimeMs`.
- Multi-step travel auto-continues by requesting the next adjacent step after cooldown expiry.
- Clicking a new destination during cooldown replaces queued continuation without resetting the active cooldown.
- Pixi renders a yellow cooldown indicator under the player icon from wall-clock time.
```

```md
<!-- docs/specs/reference/technical-solutions/README.md -->

- [Movement Cooldown](./movement-cooldown/spec.md)
```

- [ ] **Step 2: Run the full verification suite**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:jsdom
pnpm build:budget:strict
```

Expected:

- `typecheck`: PASS
- `lint`: PASS
- `test`: PASS
- `test:jsdom`: PASS
- `build:budget:strict`: PASS with bundle budget check output

- [ ] **Step 3: Commit the final docs and verification-backed implementation**

```bash
git add docs/specs/reference/gameplay-features/world-exploration/spec.md docs/specs/reference/technical-solutions/movement-cooldown/spec.md docs/specs/reference/technical-solutions/README.md
pnpm git:commit -- -m "docs: record movement cooldown behavior"
```
