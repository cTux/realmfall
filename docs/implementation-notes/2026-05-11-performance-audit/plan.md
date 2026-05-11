# Client Performance Audit Implementation Plan

> **For agentic workers:** implement only the assigned code and tests. Do not update docs, do not create commits, and do not broaden scope without escalating back to the main thread.

## Goal

Reduce avoidable startup and update-path work on the client while keeping the current audit docs aligned with the code on this branch.

## Improvement 1: Stop gating Pixi boot on visible icon preload

**Problem**

`packages/client-web/src/app/App/world/pixiWorldBootstrap.ts` awaits visible icon texture loading before `Application.init()`. That delays first paint on cold startup even though the render path already tolerates pending icon textures through placeholders and texture-version invalidation.

**Files**

- Modify: `packages/client-web/src/app/App/world/pixiWorldBootstrap.ts`
- Modify: `packages/client-web/src/app/App/tests/App.canvas.test.tsx`
- Add or adjust any targeted world-icon bootstrap coverage if the existing canvas test file becomes too broad

**Implementation plan**

1. Remove the startup `await ensureWorldIconTexturesLoaded(getVisibleWorldIconAssetIds(...))` gate ahead of `new Application()` and `app.init()`.
2. Preserve visible-icon warmup behavior by starting the preload without blocking boot if the current render path does not already trigger it naturally.
3. Keep `warmWorldIconTexturesInBackground()` for the broader catalog after the canvas is live.
4. Verify that the first render path continues to use pending-safe icon access and that texture-version invalidation repaints once loads complete.
5. Add regression coverage that proves:
   - Pixi app initialization is not blocked on visible icon preload
   - background warmup behavior remains intact
6. Verify with:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/tests/App.canvas.test.tsx
```

**Commit**

`perf: avoid icon preload blocking pixi startup`

## Improvement 2: Replace the world clock RAF loop with next-second scheduling

**Problem**

`packages/client-web/src/app/App/useWorldClockFps.ts` runs a dedicated requestAnimationFrame loop whenever the game is unpaused. The hook only needs to publish at second boundaries, so per-frame wakeups are avoidable.

**Files**

- Modify: `packages/client-web/src/app/App/useWorldClockFps.ts`
- Modify: `packages/client-web/src/app/App/tests/useWorldClockFps.test.tsx`

**Implementation plan**

1. Replace the RAF loop with timer-based scheduling aligned to the next displayed world-second boundary.
2. Preserve current pause and `visibilitychange` behavior so hidden documents do not accumulate stale time.
3. Keep `setWorldTimeMs()` semantics unchanged for explicit time jumps and test harness control.
4. Ensure minute-change callbacks still fire exactly when the published world minute changes.
5. Add coverage that proves:
   - the hook publishes second changes without RAF churn
   - pause and document visibility stop scheduling correctly
   - resuming after pause or visibility loss continues from the correct time base
6. Verify with:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/tests/useWorldClockFps.test.tsx
```

**Commit**

`perf: schedule world clock updates at second boundaries`

## Improvement 3: Narrow App shell rerender fanout from voice playback state

**Problem**

`packages/client-web/src/app/App/hooks/useAppRuntime.ts` builds a single `shellState` object that mixes home-indicator inputs with voice playback inputs, and `packages/client-web/src/app/App/components/AppShell.tsx` consumes both. Log or combat updates therefore rerun shell reconciliation work even though only the voice bridge needs that data.

**Files**

- Modify: `packages/client-web/src/app/App/hooks/useAppRuntime.ts`
- Modify: `packages/client-web/src/app/App/components/AppShell.tsx`
- Modify: `packages/client-web/src/app/App/AppShell.types.ts` if the shared type split is useful
- Modify or add: `packages/client-web/src/app/App/components/AppShell.test.tsx`

**Implementation plan**

1. Split home-indicator state and voice-playback state into separate memoized props or a narrower child boundary.
2. Keep the audio bridge subtree responsive to combat and log updates without forcing unrelated shell sections to reconcile on the same path.
3. Avoid broad behavior changes to the existing lazy-loaded windows, tooltip layer, or pause overlay.
4. Add or update tests to cover:
   - voice-playback input changes do not force unrelated shell branches to re-render
   - home-indicator updates still reach the indicator path correctly
   - audio bridge props remain functionally unchanged
5. Verify with:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/components/AppShell.test.tsx
```

**Commit**

`perf: split shell voice playback from ui render path`

## Documentation updates

Main thread only:

1. Keep this implementation note current as findings are completed.
2. Update `docs/rules/40-pixi-performance.md` with the startup and time-scheduling guidance once Improvements 1 and 2 land.
3. Update `docs/rules/30-react-ui.md` with the shell-boundary rerender guidance once Improvement 3 lands.

## Non-goal for this pass

- The large `state` chunk remains a candidate for later architectural work, but this pass does not include a gameplay-module loading redesign.
- The large icon asset chunks remain observable in the build, but this pass does not attempt a content-icon packaging redesign.
