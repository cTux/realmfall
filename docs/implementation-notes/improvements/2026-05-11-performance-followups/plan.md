# Performance Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the highest-value performance costs from the audit without changing gameplay, save behavior, or UI semantics.

**Architecture:** The work is split into four independent fixes with isolated write scopes where possible. Bootstrap-path work stays separated from world-hover analysis, deferred-window derivation, and voice runtime setup so each fix can be reviewed, verified, and committed on its own.

**Tech Stack:** TypeScript, React 19, Vite/Rolldown, Pixi 8, Vitest, pnpm

---

### Task 1: Split Bootstrap-Safe Config From Icon-Bearing App Config

**Files:**

- Create: `packages/client/src/app/interfaceSettings.config.ts`
- Create: `packages/client/src/app/worldViewport.config.ts`
- Modify: `packages/client/src/app/interfaceSettings.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldBootstrap.ts`
- Modify: `packages/client/src/main.test.tsx`
- Modify: `docs/specs/reference/technical-solutions/browser-entry-metadata/spec.md`
- Modify: `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`

- [ ] **Step 1: Add a focused test that keeps bootstrap settings detached from window-registry assets**

Add a bootstrap-oriented assertion in `packages/client/src/main.test.tsx` that continues to verify the spinner-only shell and interface-settings bootstrap path work after the config split. Keep the test focused on startup behavior, not chunk internals.

```ts
it('renders the bootstrap shell before loading the app module', async () => {
  loadInterfaceSettings.mockReturnValueOnce({
    ...defaultInterfaceSettings,
    fontFamily: 'pixel',
  });

  await import('./main');

  expect(document.querySelector('[role="status"]')).not.toBeNull();
});
```

- [ ] **Step 2: Run the targeted startup tests before editing**

Run: `pnpm --filter @realmfall/client-web exec vitest run src/main.test.tsx src/app/interfaceSettings.test.ts`

Expected: PASS for the current startup and interface-settings suites.

- [ ] **Step 3: Move entry-safe constants into tiny config modules and update imports**

Create `packages/client/src/app/interfaceSettings.config.ts` for `CLIENT_INTERFACE_SETTINGS` and `packages/client/src/app/worldViewport.config.ts` for `CLIENT_WORLD_VIEWPORT`. Update `interfaceSettings.ts` and `pixiWorldBootstrap.ts` to import those tiny modules instead of `client.config.ts`, leaving icon-bearing window-registry data in the broader config surface.

```ts
// packages/client/src/app/interfaceSettings.config.ts
import { DEFAULT_INTERFACE_FONT_FAMILY } from './interfaceFonts';

export const CLIENT_INTERFACE_SETTINGS = Object.freeze({
  defaults: {
    fontFamily: DEFAULT_INTERFACE_FONT_FAMILY,
    fontSize: 100,
    interfaceScale: 100,
    language: 'en' as const,
    showTooltipTags: true,
    windowTransparency: 0,
  },
  percentScaleDivisor: 100,
  ranges: {
    fontSize: { min: 75, max: 150, step: 1 },
    interfaceScale: { min: 75, max: 150, step: 1 },
    windowTransparency: { min: 0, max: 100, step: 1 },
  },
});
```

```ts
// packages/client/src/app/worldViewport.config.ts
export const CLIENT_WORLD_VIEWPORT = Object.freeze({
  minimumHeight: 480,
  minimumWidth: 640,
});
```

- [ ] **Step 4: Re-run targeted tests and a production build**

Run: `pnpm --filter @realmfall/client-web exec vitest run src/main.test.tsx src/app/interfaceSettings.test.ts`

Expected: PASS

Run: `pnpm --filter @realmfall/client-web build`

Expected: PASS, with the bootstrap build still succeeding and the entry HTML no longer preloading the combat-window `wolf-head` icon through the interface-settings path.

- [ ] **Step 5: Update the matching specs**

Document that the bootstrap path now reads interface settings and viewport minimums from entry-safe modules instead of the icon-bearing window-registry config.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/app/interfaceSettings.config.ts \
  packages/client/src/app/worldViewport.config.ts \
  packages/client/src/app/interfaceSettings.ts \
  packages/client/src/app/App/world/pixiWorldBootstrap.ts \
  packages/client/src/main.test.tsx \
  docs/specs/reference/technical-solutions/browser-entry-metadata/spec.md \
  docs/specs/reference/technical-solutions/react-app-orchestration/spec.md
git commit -m "refactor: split bootstrap-safe client config"
```

### Task 2: Stop Rebuilding And Re-Syncing Hover Worker State When Hover Is Idle

**Files:**

- Modify: `packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`
- Modify: `packages/client/src/app/App/world/usePixiWorldHoverLifecycle.ts`
- Modify: `packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.test.ts`
- Modify: `packages/client/src/app/App/world/hoverAnalysis/createWorkerWorldHoverAnalysisSource.test.ts`
- Modify: `packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx`
- Modify: `docs/specs/reference/technical-solutions/input-and-tooltip-handling/spec.md`

- [ ] **Step 1: Add tests for idle-hover refresh behavior and sync-state reuse**

Extend the hover-analysis tests so a refresh with no active hover state does not force a worker sync, and a repeated sync with unchanged nearby-world inputs reuses the previously built slice instead of rebuilding it.

```ts
it('does not sync hover state while hover is idle', async () => {
  const source = createWorkerWorldHoverAnalysisSourceTestkit();
  const controller = createWorldHoverInteractions({ ...baseArgs, source });

  controller.refreshHoverAnalysis();

  expect(source.syncState).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the existing hover-focused suites first**

Run: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.test.ts src/app/App/world/hoverAnalysis/createWorkerWorldHoverAnalysisSource.test.ts`

Expected: PASS before the refactor.

- [ ] **Step 3: Add a memoized nearby-world hover slice builder and gate refresh-time sync**

Keep the worker-backed design, but only build and send the hover-analysis slice when hover is active or cached, and reuse the last built state when the relevant nearby-world inputs have not changed. Do not change hover semantics, tooltip content, or pathfinding rules.

```ts
function shouldSyncHoverAnalysisState() {
  return (
    hoverPointerRef.current !== null ||
    hoverSnapshotRef.current.target !== null ||
    hoverAnalysisCacheRef.current.size > 0 ||
    pendingHoverAnalysis !== null
  );
}

const refreshHoverAnalysis = () => {
  if (!shouldSyncHoverAnalysisState()) {
    return;
  }

  syncHoverAnalysisState();
  // existing invalidation path...
};
```

- [ ] **Step 4: Narrow lifecycle refresh dependencies to real hover-analysis inputs**

Remove dependencies that do not affect hover actionability, and keep the effect keyed to the nearby-world state the worker actually consumes.

```ts
useEffect(() => {
  hoverAnalysisControllerRef.current?.refreshHoverAnalysis();
}, [
  hoverAnalysisControllerRef,
  game.combat,
  game.enemies,
  game.gameOver,
  game.activeWorldId,
  game.radius,
  game.tiles,
]);
```

- [ ] **Step 5: Re-run the hover verification suites**

Run: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.test.ts src/app/App/world/hoverAnalysis/createWorkerWorldHoverAnalysisSource.test.ts`

Expected: PASS, including the existing distant-hover guardrails.

- [ ] **Step 6: Update the input-and-tooltip spec**

Document that idle hover refreshes no longer rebuild or re-sync the worker slice, and that the synced payload is reused until nearby-world hover inputs actually change.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts \
  packages/client/src/app/App/world/pixiWorldHoverInteractions.ts \
  packages/client/src/app/App/world/usePixiWorldHoverLifecycle.ts \
  packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.test.ts \
  packages/client/src/app/App/world/hoverAnalysis/createWorkerWorldHoverAnalysisSource.test.ts \
  packages/client/src/app/App/tests/App.worldInteractionPerformance.test.tsx \
  docs/specs/reference/technical-solutions/input-and-tooltip-handling/spec.md
git commit -m "perf: avoid unnecessary hover-analysis worker sync"
```

### Task 3: Scope Deferred Window Derivations To Windows That Actually Need Them

**Files:**

- Modify: `packages/client/src/app/App/hooks/useAppRuntime.ts`
- Modify: `packages/client/src/app/App/useAppGameView.ts`
- Modify: `packages/client/src/app/App/hooks/useHexGameplayView.ts`
- Create: `packages/client/src/app/App/useAppGameView.test.ts`
- Create: `packages/client/src/app/App/hooks/useHexGameplayView.test.ts`
- Modify: `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`

- [ ] **Step 1: Add focused tests for demand-scoped derivation**

Create `packages/client/src/app/App/useAppGameView.test.ts` and assert that expensive selectors such as recipe-book entry generation, log filtering, and town-stock derivation are skipped when the related windows are hidden, while visible-window behavior remains unchanged.

```ts
it('skips recipe and log derivation when those windows are hidden', async () => {
  const getRecipeBookEntriesSpy = vi.spyOn(
    stateSelectors,
    'getRecipeBookEntries',
  );

  renderHook(() =>
    useAppGameView({
      ...baseArgs,
      viewDemand: { logs: false, recipes: false, hexTownStock: false },
    }),
  );

  expect(getRecipeBookEntriesSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the existing window-runtime hook suite before changing the app-view hooks**

Run: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/hooks/useAppWindowRuntime.test.tsx`

Expected: PASS. There is no existing dedicated `useHexGameplayView.test.ts`, so this step keeps one neighboring hook suite green before adding new demand-scoped tests.

- [ ] **Step 3: Add an explicit view-demand contract and only derive deferred slices when demanded**

Compute demand flags in `useAppRuntime` from `windowShown` plus transition-mounted windows, then teach `useAppGameView` and `useHexGameplayView` to skip expensive derived slices when their consuming windows are not visible or mounted.

```ts
const viewDemand = {
  logs: controllerState.windowShown.log,
  recipes: controllerState.windowShown.recipes,
  hexTownStock: controllerState.windowShown.hexInfo,
};

const gameView = useAppGameView({
  ...gameArgs,
  viewDemand,
});
```

```ts
const filteredLogs = useMemo(
  () => (viewDemand.logs ? logs.filter((entry) => logFilters[entry.kind]) : []),
  [viewDemand.logs, logFilters, logs],
);
```

- [ ] **Step 4: Re-run the new and existing hook suites**

Run: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/useAppGameView.test.ts src/app/App/hooks/useHexGameplayView.test.ts src/app/App/hooks/useAppWindowRuntime.test.tsx`

Expected: PASS

- [ ] **Step 5: Update the orchestration spec**

Document that deferred-window view derivation is demand-scoped and that hidden log, recipe, and town-stock surfaces no longer recompute their view models on unrelated gameplay updates.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/app/App/hooks/useAppRuntime.ts \
  packages/client/src/app/App/useAppGameView.ts \
  packages/client/src/app/App/hooks/useHexGameplayView.ts \
  packages/client/src/app/App/useAppGameView.test.ts \
  packages/client/src/app/App/hooks/useHexGameplayView.test.ts \
  docs/specs/reference/technical-solutions/react-app-orchestration/spec.md
git commit -m "perf: scope deferred window derivations"
```

### Task 4: Defer Voice Playback Setup Until Voice Playback Is Actually Viable

**Files:**

- Modify: `packages/client/src/app/App/components/AppShell.tsx`
- Modify: `packages/client/src/app/audio/voiceLibrary.ts`
- Modify: `packages/client/src/app/App/components/AppShell.test.tsx`
- Modify: `packages/client/src/app/audio/voiceLibrary.test.ts`
- Modify: `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`

- [ ] **Step 1: Add tests for effective voice-enable gating and lazy library construction**

Extend `AppShell.test.tsx` so the voice bridge is not mounted when voice playback is effectively disabled, and extend `voiceLibrary.test.ts` so the clip library is built lazily on first use instead of at module evaluation time.

```ts
it('does not mount the voice bridge when every voice trigger is disabled', async () => {
  render(
    <AppShell
      {...baseProps}
      audioSettings={{
        ...baseProps.audioSettings,
        muted: true,
        voiceVolume: 0,
        voice: {
          ...baseProps.audioSettings.voice,
          events: {
            combatAttack: false,
            combatEnd: false,
            combatExertion: false,
            playerDamaged: false,
            playerDeath: false,
          },
        },
      }}
    />,
  );

  expect(screen.queryByTestId('voice-audio-bridge')).toBeNull();
});
```

- [ ] **Step 2: Run the existing audio-focused tests**

Run: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/components/AppShell.test.tsx src/app/audio/VoiceAudioControllerBridge.test.tsx src/app/audio/voiceLibrary.test.ts`

Expected: PASS

- [ ] **Step 3: Gate the voice bridge on effective voice-playback eligibility and lazily build the clip library**

Keep the current user-activation rule, but only mount the recorded-voice bridge when the feature can actually play audio. Replace the eager `VOICE_CLIP_LIBRARY` constant with a cached getter so the large clip catalog is assembled only when a voice clip is first requested.

```ts
function canPlayRecordedVoice(audioSettings: AudioSettings) {
  return (
    !audioSettings.muted &&
    audioSettings.voiceVolume > 0 &&
    Object.values(audioSettings.voice.events).some(Boolean)
  );
}
```

```ts
let voiceClipLibrary: Record<
  VoiceActorId,
  Record<VoiceClipCategory, VoiceClipEntry[]>
> | null = null;

function getVoiceClipLibrary() {
  voiceClipLibrary ??= buildVoiceClipLibrary(voiceClipModules);
  return voiceClipLibrary;
}
```

- [ ] **Step 4: Re-run the audio tests**

Run: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/components/AppShell.test.tsx src/app/audio/VoiceAudioControllerBridge.test.tsx src/app/audio/voiceLibrary.test.ts`

Expected: PASS

- [ ] **Step 5: Update the orchestration spec**

Document that the voice bridge now stays behind both user activation and effective voice-playback eligibility, and that the voice clip library is indexed lazily on first use.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/app/App/components/AppShell.tsx \
  packages/client/src/app/audio/voiceLibrary.ts \
  packages/client/src/app/App/components/AppShell.test.tsx \
  packages/client/src/app/audio/voiceLibrary.test.ts \
  docs/specs/reference/technical-solutions/react-app-orchestration/spec.md
git commit -m "perf: defer voice playback setup"
```

## Self-Review

- Spec coverage: the four audit findings map one-to-one to Tasks 1-4, and each task includes its matching spec updates.
- Placeholder scan: each task names concrete files, commands, and intended code shape; no `TBD` or deferred follow-up markers remain.
- Type consistency: the plan keeps existing naming where possible and introduces only narrow new config or demand objects.

## Execution Handoff

Plan saved to `docs/implementation-notes/improvements/2026-05-11-performance-followups/plan.md`.

Execution mode is fixed by the user request: subagent-driven implementation only for improvements/fixes, with main-thread integration, docs, verification, and one commit per fix.
