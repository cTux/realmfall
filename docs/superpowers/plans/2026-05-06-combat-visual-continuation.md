# Combat Visual Continuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the movement cooldown arc touch the MP arc exactly and make post-victory hostile auto-step motion continue from the held combat lunge into the target hex over the normal full move duration.

**Architecture:** Keep the gameplay rules unchanged and fix the remaining issues in the render and transition layers. The cooldown ring stays on the existing shared badge helper path, while the post-combat auto-step uses one extra optional `playerOffsetAtStart` value on `WorldMovementTransition` so the player wrapper can ease from the held lunge back to center while the world slide runs normally.

**Tech Stack:** TypeScript, React 19, Pixi.js 8, Vitest (`node` and `jsdom` projects), `pnpm`

---

## File Structure

- `packages/client/src/ui/world/renderScenePlayerBars.ts`
  Shared cooldown-ring geometry for the player and roaming dungeon-enemy badge arcs.
- `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
  Renderer regression coverage for cooldown-ring spacing and carried player-wrapper offset during movement transitions.
- `packages/client/src/ui/world/renderSceneDungeonEnemyMovement.test.ts`
  Existing roaming-enemy cooldown render path that should stay green after the shared cooldown-band change.
- `packages/client/src/app/App/world/movement/worldMovementTransition.ts`
  Movement-transition data contract used by `usePixiWorld` and the world renderer.
- `packages/client/src/app/App/world/movement/worldMovementTransition.test.ts`
  Narrow node coverage for transition shape changes.
- `packages/client/src/ui/world/worldCombatLunge.ts`
  Shared lunge-math helper so render and app code can reuse the same offset calculation without coupling the hook to the full combat-feedback renderer.
- `packages/client/src/ui/world/renderScene.ts`
  Top-level render orchestration that derives transition-driven world and player offsets each frame.
- `packages/client/src/ui/world/renderSceneAnimated.ts`
  Animated-layer player positioning and movement-cooldown/combat-feedback anchor wiring.
- `packages/client/src/ui/world/renderSceneCombatFeedback.ts`
  Floating-text and combat-feedback rendering that should keep using the shared lunge helper after the extraction.
- `packages/client/src/app/App/usePixiWorld.ts`
  Auto-step cooldown seeding plus the bridge from resolved combat state into a follow-up world movement transition.
- `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`
  Jsdom coverage for staged hostile clicks, victory auto-step, and the post-combat transition payload.
- `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
  Canonical spec for cooldown rendering and hostile-click auto-step cooldown behavior.
- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
  Canonical render-layer spec for lunge carry-through and cooldown-arc presentation.
- `docs/specs/reference/gameplay-features/combat/spec.md`
  Canonical combat-facing shipped behavior for post-victory hostile auto-step presentation.
- `docs/specs/reference/gameplay-features/world-exploration/spec.md`
  Canonical world-travel behavior for hostile staging, slide timing, and auto-step follow-through.

### Task 1: Make The Cooldown Arc Touch The MP Arc Exactly

**Files:**

- Modify: `packages/client/src/ui/world/renderScenePlayerBars.ts`
- Modify: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
- Test: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
- Test: `packages/client/src/ui/world/renderSceneDungeonEnemyMovement.test.ts`

- [ ] **Step 1: Tighten the existing player cooldown render test to assert zero gap**

```ts
// packages/client/src/ui/world/renderSceneMovementCooldown.test.ts
it('draws a yellow outer cooldown arc that touches the player mana ring with no gap while movement cooldown remains active', async () => {
  const { renderScene } = await import('./renderScene');
  const game = createGame(2, 'render-scene-move-cooldown');
  const app = createMockApp();

  renderScene(
    app as never,
    game,
    getVisibleTiles(game),
    game.player.coord,
    null,
    12 * 60,
    250,
    null,
    {
      movementCooldown: {
        durationMs: 1_000,
        endAtMs: 1_000,
        nowMs: 250,
      },
    } as never,
  );

  const cooldownGraphics = collectDescendants(getPlayerLayer(app)).filter(
    (child): child is MockGraphics =>
      child instanceof MockGraphics && child.visible,
  );

  const cooldownFillArc = cooldownGraphics.find(
    (graphic) =>
      graphic.beginFill.mock.calls.some(
        ([color, alpha]) => color === 0xfacc15 && alpha === 0.95,
      ) && graphic.drawPolygon.mock.calls.length > 0,
  );
  const cooldownTrackArc = cooldownGraphics.find(
    (graphic) =>
      graphic.beginFill.mock.calls.some(
        ([color, alpha]) => color === 0x422006 && alpha === 0.85,
      ) && graphic.drawPolygon.mock.calls.length > 0,
  );
  const manaTrackArc = cooldownGraphics.find(
    (graphic) =>
      graphic.beginFill.mock.calls.some(
        ([color, alpha]) => color === 0x172554 && alpha === 0.94,
      ) && graphic.drawPolygon.mock.calls.length > 0,
  );

  expect(cooldownFillArc).toBeDefined();
  expect(cooldownTrackArc).toBeDefined();
  expect(manaTrackArc).toBeDefined();
  expect(getGraphicThickness(cooldownTrackArc!)).toBeCloseTo(
    getGraphicThickness(manaTrackArc!),
    3,
  );
  expect(getMinGraphicRadius(cooldownTrackArc!)).toBeCloseTo(
    getMaxGraphicRadius(manaTrackArc!),
    3,
  );
  expect(getMinGraphicRadius(cooldownFillArc!)).toBeCloseTo(
    getMaxGraphicRadius(manaTrackArc!),
    3,
  );
});
```

- [ ] **Step 2: Run the focused renderer tests and confirm the gap assertion fails**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/ui/world/renderSceneMovementCooldown.test.ts src/ui/world/renderSceneDungeonEnemyMovement.test.ts
```

Expected: FAIL in `renderSceneMovementCooldown.test.ts` because `COOLDOWN_ARC_GAP_PX = 3` leaves a measurable separation between the MP track and the cooldown track.

- [ ] **Step 3: Remove the explicit gap from the cooldown arc helper**

```ts
// packages/client/src/ui/world/renderScenePlayerBars.ts
function getMovementCooldownArcBand(badgeOuterRadius: number) {
  return expandEntityBadgeArcBand(getEntityBadgeArcBand(badgeOuterRadius), 0);
}
```

```ts
// packages/client/src/ui/world/renderScenePlayerBars.ts
// Delete this constant because the approved geometry is exact touch:
// const COOLDOWN_ARC_GAP_PX = 3;
```

- [ ] **Step 4: Re-run the focused renderer tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/ui/world/renderSceneMovementCooldown.test.ts src/ui/world/renderSceneDungeonEnemyMovement.test.ts
```

Expected: PASS. The player cooldown arc now touches the MP arc exactly, and the roaming dungeon-enemy cooldown path keeps rendering through the same shared helper.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/ui/world/renderScenePlayerBars.ts packages/client/src/ui/world/renderSceneMovementCooldown.test.ts
pnpm git:commit -- -m "fix: tighten cooldown arc spacing"
```

### Task 2: Carry A Player Offset Through Movement Transitions

**Files:**

- Modify: `packages/client/src/app/App/world/movement/worldMovementTransition.ts`
- Modify: `packages/client/src/app/App/world/movement/worldMovementTransition.test.ts`
- Create: `packages/client/src/ui/world/worldCombatLunge.ts`
- Modify: `packages/client/src/ui/world/renderScene.ts`
- Modify: `packages/client/src/ui/world/renderSceneAnimated.ts`
- Modify: `packages/client/src/ui/world/renderSceneCombatFeedback.ts`
- Modify: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
- Test: `packages/client/src/app/App/world/movement/worldMovementTransition.test.ts`
- Test: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
- Test: `packages/client/src/ui/world/renderSceneCombatFeedback.test.ts`

- [ ] **Step 1: Add failing transition-shape and render-behavior tests**

```ts
// packages/client/src/app/App/world/movement/worldMovementTransition.test.ts
it('preserves an initial player offset for post-combat visual continuation', () => {
  expect(
    createWorldMovementTransition({
      fromCoord: { q: 1, r: 0 },
      nextVisibleTiles: [],
      previousVisibleTiles: [],
      startedAtMs: 0,
      toCoord: { q: 2, r: 0 },
      playerOffsetAtStart: { x: 18, y: -4 },
    }),
  ).toMatchObject({
    fromCoord: { q: 1, r: 0 },
    toCoord: { q: 2, r: 0 },
    playerOffsetAtStart: { x: 18, y: -4 },
  });
});
```

```ts
// packages/client/src/ui/world/renderSceneMovementCooldown.test.ts
it('keeps the player wrapper forward during a carried transition and eases it back to center by the end', async () => {
  const { renderScene } = await import('./renderScene');
  const game = createGame(2, 'render-scene-post-combat-carry');
  const baselineApp = createMockApp();
  const startApp = createMockApp();
  const midApp = createMockApp();
  const endApp = createMockApp();

  game.player.coord = { q: 2, r: 0 };
  const visibleTiles = getVisibleTiles(game);
  const carriedTransition = {
    durationMs: 1_000,
    fromCoord: { q: 1, r: 0 },
    incomingTiles: [],
    nowMs: 0,
    outgoingTiles: [],
    playerOffsetAtStart: { x: 18, y: 0 },
    startedAtMs: 0,
    toCoord: { q: 2, r: 0 },
  };

  renderScene(
    baselineApp as never,
    game,
    visibleTiles,
    game.player.coord,
    null,
    12 * 60,
    0,
  );
  renderScene(
    startApp as never,
    game,
    visibleTiles,
    game.player.coord,
    null,
    12 * 60,
    0,
    null,
    {
      movementTransition: {
        ...carriedTransition,
        nowMs: 0,
      },
    } as never,
  );
  renderScene(
    midApp as never,
    game,
    visibleTiles,
    game.player.coord,
    null,
    12 * 60,
    0,
    null,
    {
      movementTransition: {
        ...carriedTransition,
        nowMs: 500,
      },
    } as never,
  );
  renderScene(
    endApp as never,
    game,
    visibleTiles,
    game.player.coord,
    null,
    12 * 60,
    0,
    null,
    {
      movementTransition: {
        ...carriedTransition,
        nowMs: 1_000,
      },
    } as never,
  );

  const baselineWrapper = getPlayerLayer(baselineApp).children[2] as
    | MockContainer
    | undefined;
  const startWrapper = getPlayerLayer(startApp).children[2] as
    | MockContainer
    | undefined;
  const midWrapper = getPlayerLayer(midApp).children[2] as
    | MockContainer
    | undefined;
  const endWrapper = getPlayerLayer(endApp).children[2] as
    | MockContainer
    | undefined;

  expect(baselineWrapper).toBeDefined();
  expect(startWrapper).toBeDefined();
  expect(midWrapper).toBeDefined();
  expect(endWrapper).toBeDefined();
  expect(startWrapper!.position.x - baselineWrapper!.position.x).toBeCloseTo(
    18,
    4,
  );
  expect(midWrapper!.position.x - baselineWrapper!.position.x).toBeCloseTo(
    9,
    4,
  );
  expect(endWrapper!.position.x).toBeCloseTo(baselineWrapper!.position.x, 4);
});
```

- [ ] **Step 2: Run the focused node tests and confirm they fail before the transition contract exists**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/movement/worldMovementTransition.test.ts src/ui/world/renderSceneMovementCooldown.test.ts
```

Expected: FAIL because `WorldMovementTransition` and `renderScene` do not yet accept or apply `playerOffsetAtStart`.

- [ ] **Step 3: Extract shared lunge math, thread an optional `playerOffsetAtStart` through the transition, and render it down to zero over the normal move duration**

```ts
// packages/client/src/ui/world/worldCombatLunge.ts
import { WORLD_COMBAT_LUNGE_DURATION_MS } from '../../game/worldCombatPresentation';
import type { HexCoord } from '../../game/stateTypes';
import { tileToPoint } from './renderSceneMath';

const PLAYER_LUNGE_DISTANCE_RATIO = 0.16;
const PLAYER_LUNGE_MIN_PX = 8;

export function getWorldCombatLungeOffset({
  hexSize,
  phase,
  stagingCoord,
  startedAtMs,
  targetCoord,
  worldTimeMs,
}: {
  hexSize: number;
  phase: 'animating' | 'held';
  stagingCoord: HexCoord;
  startedAtMs: number;
  targetCoord: HexCoord;
  worldTimeMs: number;
}) {
  const targetDelta = tileToPoint(
    {
      q: targetCoord.q - stagingCoord.q,
      r: targetCoord.r - stagingCoord.r,
    },
    0,
    0,
    hexSize,
  );
  const distance = Math.hypot(targetDelta.x, targetDelta.y);
  if (distance <= 0) {
    return { x: 0, y: 0 };
  }

  const rawProgress =
    phase === 'held'
      ? 1
      : Math.max(
          0,
          Math.min(
            1,
            (worldTimeMs - startedAtMs) / WORLD_COMBAT_LUNGE_DURATION_MS,
          ),
        );
  const progress = phase === 'held' ? 1 : Math.sin((rawProgress * Math.PI) / 2);
  const lungeDistance = Math.min(
    distance * PLAYER_LUNGE_DISTANCE_RATIO,
    Math.max(PLAYER_LUNGE_MIN_PX, hexSize * PLAYER_LUNGE_DISTANCE_RATIO),
  );

  return {
    x: (targetDelta.x / distance) * lungeDistance * progress,
    y: (targetDelta.y / distance) * lungeDistance * progress,
  };
}
```

```ts
// packages/client/src/app/App/world/movement/worldMovementTransition.ts
export interface WorldMovementTransition {
  displayTiles: VisibleWorldTile[];
  durationMs: number;
  fromCoord: HexCoord;
  incomingTiles: VisibleWorldTile[];
  outgoingTiles: VisibleWorldTile[];
  playerOffsetAtStart?: {
    x: number;
    y: number;
  };
  startedAtMs: number;
  toCoord: HexCoord;
}

export function createWorldMovementTransition({
  durationMs = WORLD_MOVE_VISUAL_DURATION_MS,
  fromCoord,
  nextVisibleTiles,
  previousVisibleTiles,
  startedAtMs,
  toCoord,
  playerOffsetAtStart,
}: {
  durationMs?: number;
  fromCoord: HexCoord;
  nextVisibleTiles: VisibleWorldTile[];
  previousVisibleTiles: VisibleWorldTile[];
  startedAtMs: number;
  toCoord: HexCoord;
  playerOffsetAtStart?: { x: number; y: number };
}) {
  if (hexDistance(fromCoord, toCoord) !== 1) {
    return null;
  }

  // existing displayTiles/incomingTiles/outgoingTiles setup stays unchanged

  return {
    displayTiles: [
      ...previousVisibleTiles.map(
        (tile) => nextVisibleTilesByKey.get(hexKey(tile.coord)) ?? tile,
      ),
      ...incomingTiles,
    ],
    durationMs,
    fromCoord,
    incomingTiles,
    outgoingTiles,
    playerOffsetAtStart,
    startedAtMs,
    toCoord,
  } satisfies WorldMovementTransition;
}
```

```ts
// packages/client/src/ui/world/renderSceneCombatFeedback.ts
import { getWorldCombatLungeOffset } from './worldCombatLunge';

export function getCombatLungeOffset({
  hexSize,
  state,
  worldTimeMs,
}: {
  hexSize: number;
  state: GameState;
  worldTimeMs: number;
}) {
  const descriptor = getCombatLungeDescriptor(state);
  if (!descriptor) {
    return { x: 0, y: 0 };
  }

  return getWorldCombatLungeOffset({
    hexSize,
    phase: descriptor.phase,
    stagingCoord: descriptor.stagingCoord,
    startedAtMs: descriptor.startedAtMs,
    targetCoord: descriptor.targetCoord,
    worldTimeMs,
  });
}
```

```ts
// packages/client/src/ui/world/renderScene.ts
interface RenderSceneMovementTransition {
  displayTiles?: VisibleWorldTile[];
  durationMs: number;
  fromCoord: HexCoord;
  incomingTiles: VisibleWorldTile[];
  nowMs: number;
  outgoingTiles: VisibleWorldTile[];
  playerOffsetAtStart?: {
    x: number;
    y: number;
  };
  startedAtMs: number;
  toCoord: HexCoord;
}

const transitionPlayerOffset = getMovementTransitionPlayerOffset(
  movementTransition,
);

renderAnimatedScene({
  animationMs,
  animatedRenderToken,
  app,
  cloudInputs,
  cloudParallaxOffset,
  enemyIconSize,
  fullscreenVisualEffects,
  hexSize,
  lightingState,
  movementCooldown,
  movementTransitionRevealState,
  origin,
  playerCoord: state.player.coord,
  playerIconSize,
  playerTransitionOffset: transitionPlayerOffset,
  scene,
  state,
  visibleTileRenderInputs: renderTokens.visibleTileRenderInputs,
  worldKind: currentWorldKind,
  worldTimeMs: renderWorldTimeMs,
});

function getMovementTransitionPlayerOffset(
  movementTransition: RenderSceneMovementTransition | null,
) {
  if (!movementTransition?.playerOffsetAtStart) {
    return { x: 0, y: 0 };
  }

  const progress = getMovementTransitionProgress(movementTransition);
  if (progress === null) {
    return { x: 0, y: 0 };
  }

  const remainingProgress = 1 - progress;
  return {
    x: movementTransition.playerOffsetAtStart.x * remainingProgress,
    y: movementTransition.playerOffsetAtStart.y * remainingProgress,
  };
}
```

```ts
// packages/client/src/ui/world/renderSceneAnimated.ts
interface RenderAnimatedSceneOptions {
  // existing fields...
  playerTransitionOffset: { x: number; y: number };
}

export function renderAnimatedScene({
  // existing args...
  playerTransitionOffset,
  playerIconSize,
  state,
  visibleTileRenderInputs,
  worldKind,
  worldTimeMs,
}: RenderAnimatedSceneOptions) {
  const combatLungeOffset = getCombatLungeOffset({
    hexSize,
    state,
    worldTimeMs,
  });
  const playerVisualOffset = {
    x: combatLungeOffset.x + playerTransitionOffset.x,
    y: combatLungeOffset.y + playerTransitionOffset.y,
  };
  const playerOrigin = {
    x: origin.x + playerVisualOffset.x,
    y: origin.y + playerVisualOffset.y,
  };

  configureShadowedSprite(
    scene.player,
    scaleColor(
      0xffffff,
      Math.max(0.84, lightingState.lighting.ambientBrightness + 0.08),
    ),
    playerIconSize,
    playerIconSize,
    1,
    lightingState.shadowOffset,
    playerOrigin,
  );

  renderPlayerMovementCooldown({
    scene,
    origin: playerOrigin,
    playerIconSize,
    movementCooldown,
  });

  renderSceneCombatFeedback({
    enemyIconSize,
    hexSize,
    origin,
    playerCoord,
    playerIconSize,
    playerLungeOffset: playerVisualOffset,
    scene,
    state,
    visibleTileRenderInputs,
    worldTimeMs,
  });
}
```

- [ ] **Step 4: Re-run the focused node tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/movement/worldMovementTransition.test.ts src/ui/world/renderSceneMovementCooldown.test.ts src/ui/world/renderSceneCombatFeedback.test.ts
```

Expected: PASS. The transition contract keeps the initial player offset, the renderer now decays that carry-through offset to zero over the normal world-move duration, and the extracted lunge helper preserves the existing combat-lunge render behavior.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/app/App/world/movement/worldMovementTransition.ts packages/client/src/app/App/world/movement/worldMovementTransition.test.ts packages/client/src/ui/world/worldCombatLunge.ts packages/client/src/ui/world/renderScene.ts packages/client/src/ui/world/renderSceneAnimated.ts packages/client/src/ui/world/renderSceneCombatFeedback.ts packages/client/src/ui/world/renderSceneMovementCooldown.test.ts
pnpm git:commit -- -m "fix: carry player offset through world transitions"
```

### Task 3: Seed The Carried Offset From Victory Auto-Step Resolution

**Files:**

- Modify: `packages/client/src/app/App/usePixiWorld.ts`
- Modify: `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`
- Test: `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`

- [ ] **Step 1: Add a failing hostile-click integration assertion for the post-victory transition payload**

```ts
// packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx
const postResolutionCall = renderScene.mock.calls
  .slice(renderCallCountBeforeResolution)
  .find((call) => call[8]?.movementCooldown != null);
const renderOptions = postResolutionCall?.[8];

expect(renderOptions?.movementTransition).toMatchObject({
  durationMs: WORLD_MOVE_VISUAL_DURATION_MS,
  fromCoord: { q: 1, r: 0 },
  toCoord: { q: 2, r: 0 },
});
expect(renderOptions?.movementTransition?.playerOffsetAtStart?.x ?? 0).toBeGreaterThan(0);
expect(Math.abs(renderOptions?.movementTransition?.playerOffsetAtStart?.y ?? 0)).toBeLessThan(1);
expect(renderOptions?.movementCooldown).toMatchObject({
  durationMs: WORLD_MOVE_HEX_COOLDOWN_MS,
});
```

- [ ] **Step 2: Run the focused jsdom suite and confirm the new assertion fails**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldHostileClickCombat.test.tsx
```

Expected: FAIL because the resolved hostile-click transition does not yet carry any saved player offset into `movementTransition`.

- [ ] **Step 3: Capture the held combat lunge offset before combat teardown and pass it into the next transition**

```ts
// packages/client/src/app/App/usePixiWorld.ts
import { getWorldHexSize } from '../../ui/world/renderSceneMath';
import { getWorldCombatLungeOffset } from '../../ui/world/worldCombatLunge';

const pendingVictoryTransitionOffsetRef = useRef<{
  fromCoord: HexCoord;
  offset: { x: number; y: number };
  toCoord: HexCoord;
} | null>(null);
```

```ts
// packages/client/src/app/App/usePixiWorld.ts
useEffect(() => {
  const previousGame = previousGameRef.current;
  const previousEngagement = previousGame.combat?.engagement;
  if (
    previousGame !== game &&
    previousEngagement?.autoStepOnVictory &&
    previousEngagement.targetCoord !== null &&
    game.combat === null &&
    sameCoord(game.player.coord, previousEngagement.targetCoord) &&
    !sameCoord(previousGame.player.coord, previousEngagement.targetCoord)
  ) {
    const carriedOffset = getPostCombatTransitionOffset({
      app: appRef.current,
      previousGame,
    });
    if (carriedOffset) {
      pendingVictoryTransitionOffsetRef.current = {
        fromCoord: previousGame.player.coord,
        offset: carriedOffset,
        toCoord: previousEngagement.targetCoord,
      };
    }

    const cooldownEndAtMs = performance.now() + WORLD_MOVE_HEX_COOLDOWN_MS;
    const movementController = movementControllerRef.current;
    if (movementController) {
      movementController.seedCooldownUntil(cooldownEndAtMs);
    } else {
      movementCooldownEndAtRef.current = cooldownEndAtMs;
      renderInvalidationRef.current += 1;
    }
  }

  previousGameRef.current = game;
}, [game]);
```

```ts
// packages/client/src/app/App/usePixiWorld.ts
useEffect(() => {
  const previousPlayerCoord = playerCoordRef.current;
  const previousVisibleTiles = visibleTilesRef.current;
  const nextVisibleTiles = reuseVisibleTilesRef.current(
    visibleTilesRef.current,
    buildVisibleTilesRef.current({
      overlay: resolutionOverlayRef.current,
      playerCoord,
      radius: game.radius,
      resolvedTiles: game.tiles,
    }),
  );

  playerCoordRef.current = playerCoord;
  visibleTilesRef.current = nextVisibleTiles;

  if (sameCoord(previousPlayerCoord, playerCoord)) {
    return;
  }

  const pendingVictoryTransitionOffset =
    pendingVictoryTransitionOffsetRef.current;
  const playerOffsetAtStart =
    pendingVictoryTransitionOffset &&
    sameCoord(pendingVictoryTransitionOffset.fromCoord, previousPlayerCoord) &&
    sameCoord(pendingVictoryTransitionOffset.toCoord, playerCoord)
      ? pendingVictoryTransitionOffset.offset
      : undefined;
  pendingVictoryTransitionOffsetRef.current = null;

  const nextTransition = createWorldMovementTransition({
    durationMs: WORLD_MOVE_VISUAL_DURATION_MS,
    fromCoord: previousPlayerCoord,
    nextVisibleTiles,
    previousVisibleTiles,
    startedAtMs: performance.now(),
    toCoord: playerCoord,
    playerOffsetAtStart,
  });

  if (nextTransition) {
    movementTransitionRef.current = nextTransition;
    renderInvalidationRef.current += 1;
    return;
  }

  if (movementTransitionRef.current !== null) {
    movementTransitionRef.current = null;
    renderInvalidationRef.current += 1;
  }
}, [game.radius, game.tiles, playerCoord]);
```

```ts
// packages/client/src/app/App/usePixiWorld.ts
function getPostCombatTransitionOffset({
  app,
  previousGame,
}: {
  app: Application | null;
  previousGame: GameState;
}) {
  const combat = previousGame.combat;
  const engagement = combat?.engagement;
  if (
    !app ||
    combat === null ||
    combat.startedAtMs == null ||
    !engagement?.stagingCoord ||
    !engagement.targetCoord
  ) {
    return null;
  }

  const hexSize = getWorldHexSize(app.screen, previousGame.radius);
  const offset = getWorldCombatLungeOffset({
    hexSize,
    phase: combat.started ? 'held' : 'animating',
    stagingCoord: engagement.stagingCoord,
    startedAtMs: combat.startedAtMs,
    targetCoord: engagement.targetCoord,
    worldTimeMs: previousGame.worldTimeMs,
  });

  return Math.hypot(offset.x, offset.y) > 0 ? offset : null;
}
```

- [ ] **Step 4: Re-run the focused jsdom suite**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldHostileClickCombat.test.tsx
```

Expected: PASS. The hostile-click resolution path now seeds a positive `playerOffsetAtStart` on the post-victory transition while keeping the full `WORLD_MOVE_VISUAL_DURATION_MS` duration and the normal movement cooldown.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/app/App/usePixiWorld.ts packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx
pnpm git:commit -- -m "fix: continue victory auto-step from combat lunge"
```

### Task 4: Update Canonical Specs And Run Full Verification

**Files:**

- Modify: `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
- Modify: `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- Modify: `docs/specs/reference/gameplay-features/combat/spec.md`
- Modify: `docs/specs/reference/gameplay-features/world-exploration/spec.md`

- [ ] **Step 1: Align the shipped specs with the final zero-gap ring and post-combat carry-through behavior**

```md
<!-- docs/specs/reference/technical-solutions/movement-cooldown/spec.md -->

- Hostile-click encounters that auto-step onto their preserved hostile target after victory seed the same normal movement cooldown controller and transition path as any other approved one-hex move, and that follow-up transition starts from the held combat lunge instead of resetting to hex center first.
- Pixi renders a yellow outer cooldown arc from wall-clock time that touches the player MP ring with no gap, and roaming dungeon enemies reuse that same zero-gap outer-ring presentation on revealed tiles during their movement cooldown.
```

```md
<!-- docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md -->

- `renderSceneCombatFeedback.ts` owns a render-only player lunge toward `combat.engagement.targetCoord`, using engagement staging and target coordinates plus combat start time without mutating gameplay position.
- Post-victory hostile auto-step transitions can carry a starting player-screen offset so the full-duration world slide continues from the held lunge instead of snapping the player wrapper back to center first.
- Player movement cooldown and revealed roaming dungeon enemy movement cooldowns render as outer arcs that touch the badge MP ring with no gap.
```

```md
<!-- docs/specs/reference/gameplay-features/combat/spec.md -->

- Winning a hostile-click or roaming-chase encounter can auto-step the player onto the preserved hostile target after the final enemy dies, continue the visual move from the held lunge into that target hex, then the app applies the normal movement cooldown for that step.
```

```md
<!-- docs/specs/reference/gameplay-features/world-exploration/spec.md -->

- Winning a hostile-click encounter can auto-step the player from its staging hex onto the hostile destination, and that follow-through slide continues from the held lunge instead of resetting to the staging-hex center first, then starts the normal `1000 ms` movement cooldown for that step.
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

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm test`: PASS
- `pnpm test:jsdom`: PASS
- `pnpm build:budget:strict`: PASS

- [ ] **Step 3: Commit the spec alignment after the verification pass**

```bash
git add docs/specs/reference/technical-solutions/movement-cooldown/spec.md docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md docs/specs/reference/gameplay-features/combat/spec.md docs/specs/reference/gameplay-features/world-exploration/spec.md
pnpm git:commit -- -m "docs: align combat continuation specs"
```
