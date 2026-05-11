# Client Performance Audit Implementation Plan

> **For agentic workers:** implement only the assigned code and tests. Do not update docs, do not create commits, and do not broaden scope without escalating back to the main thread.

## Goal

Reduce avoidable work on the client interaction path and keep the repo's performance notes aligned with the current codebase.

## Improvement 1: Replace `JSON.stringify` hover-slice diffing

**Problem**

`packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts` currently serializes each nearby tile and enemy to decide whether hover-analysis state changed. That pushes full-object string allocation into a path that can run repeatedly while the world is active.

**Files**

- Modify: `packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts`
- Modify: `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`
- Add or modify targeted hover-analysis tests if a narrower unit file is better

**Implementation plan**

1. Replace the current full-object signature helpers with targeted structural fingerprints.
2. Keep the fingerprint fields limited to data that affects hover analysis:
   - tile coord, terrain, structure, unknown/requested state, enemy ids, and any pathfinding-relevant claim or blocker state
   - enemy id, coord, hp, maxHp, elite/tier, and any other fields the hover runtime actually consumes
3. Preserve the current nearby-slice boundary. This task is about cheaper diffing, not a broader hover-state redesign.
4. Add regression coverage that proves:
   - far-away tile or enemy mutations do not trigger a sync
   - nearby actionable changes do trigger a sync
5. Verify with:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx
```

**Commit**

`perf: reduce hover analysis refresh diff cost`

## Improvement 2: Remove synthetic `pointermove` redispatch from hover refresh

**Problem**

`packages/client/src/app/App/world/pixiWorldHoverInteractions.ts` calls `canvas.dispatchEvent(new PointerEvent('pointermove', ...))` during `refreshHoverAnalysis()`. The controller already owns the hover pointer state and `processPointerMove`, so the redispatch burns DOM/listener work and obscures the real refresh path.

**Files**

- Modify: `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`
- Modify: `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`

**Implementation plan**

1. Extract a small internal helper that schedules or performs hover reprocessing directly from cached pointer coordinates.
2. Reuse that helper from both `queuePointerMove()` and `refreshHoverAnalysis()`.
3. Keep the existing requestAnimationFrame throttling behavior for ordinary pointer moves.
4. Avoid changing external controller behavior or tooltip semantics.
5. Add coverage that proves refresh no longer depends on synthetic canvas pointer events.
6. Verify with:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx
```

**Commit**

`perf: refresh hover analysis without redispatching pointer events`

## Improvement 3: Replace settings dirty-check stringification

**Problem**

`packages/client/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.tsx` recomputes `dirty` by stringifying four settings objects every render. The comparison is deterministic today, but the work is unnecessary and ties correctness to object-serialization shape.

**Files**

- Modify: `packages/client/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.tsx`
- Modify or add: `packages/client/src/ui/components/GameSettingsWindow/__tests__/*`

**Implementation plan**

1. Add explicit equality helpers for graphics, audio, interface, and gameplay settings.
2. Keep the comparisons narrow and field-based so future schema changes are visible in code review.
3. Use those helpers to derive `dirty` without serialization.
4. Add or update tests to cover:
   - unchanged drafts stay clean
   - a single-field change marks the form dirty
   - resetting props back to the current saved value clears dirty state
5. Verify with:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project jsdom packages/client/src/ui/components/GameSettingsWindow/__tests__
```

If the package-level test glob is too broad, run only the touched test file.

**Commit**

`perf: replace settings dirty-check stringification`

## Documentation updates

Main thread only:

1. Keep this implementation note current as findings are completed.
2. Update `docs/rules/40-pixi-performance.md` with the recurring hover-refresh guidance once Improvement 1 and 2 land.
3. Update `docs/rules/30-react-ui.md` with the recurring settings-comparison guidance once Improvement 3 lands.

## Non-goal for this pass

- The large eager `state` chunk remains a candidate for later architectural work, but this pass does not include a gameplay-module loading redesign.
