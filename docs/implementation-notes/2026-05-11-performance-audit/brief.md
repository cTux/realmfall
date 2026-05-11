# 2026-05-11 Performance Audit Brief

## Scope

- Repo: `realmfall`
- Audit focus: current client runtime hot paths, Pixi world startup behavior, React shell rerender fanout, and current production bundle shape
- Evidence gathered from source review plus a fresh `pnpm --filter @realmfall/client-web build` on 2026-05-11

## Current Build Snapshot

- `assets/js/pixi-DXyMWTIn.js`: `514.32 kB` (`146.96 kB` gzip)
- `assets/js/state-WQQxaMRz.js`: `391.46 kB` (`93.58 kB` gzip)
- `assets/js/gameplayIconAssets-DdcnjRmF.js`: `170.11 kB` (`67.15 kB` gzip)
- `assets/js/App-TWKXM0C8.js`: `114.64 kB` (`35.02 kB` gzip)
- `assets/js/renderScene-BvlC0AwE.js`: `40.42 kB` (`13.73 kB` gzip)

## Findings

1. `packages/client-web/src/app/App/world/pixiWorldBootstrap.ts:162` awaits visible-world icon texture preloads before `Application.init()`. The render path already supports pending textures through placeholders, so cold-starting the canvas is blocked on network and image decode work that does not have to gate first paint.

2. `packages/client-web/src/app/App/useWorldClockFps.ts:49` keeps a dedicated requestAnimationFrame loop running while unpaused even though it only publishes when the displayed world second changes. That creates avoidable scheduler wakeups and duplicates timing work beside the shared world renderer.

3. `packages/client-web/src/app/App/hooks/useAppRuntime.ts:306` and `packages/client-web/src/app/App/components/AppShell.tsx:89` funnel audio-only voice playback inputs through the top-level shell prop object. Combat log, combat state, and player status changes therefore rerun shell reconciliation work that only the audio bridge consumes.

## Confirmed Current State

- The older hover-analysis stringify finding is no longer current. `worldHoverAnalysisTypes.ts` now uses targeted string fingerprints instead of `JSON.stringify`.
- The older synthetic-pointer redispatch finding is no longer current. `refreshHoverAnalysis()` reuses local pointer processing instead of dispatching a DOM `pointermove`.
- The older settings dirty-check stringify finding is no longer current. `GameSettingsWindowContent.tsx` now uses explicit equality helpers.
- The current `gameplayIconAssets` and `generatedIconAssets` chunks are large, but they are not the first low-risk fixes for this pass. The startup and rerender findings above have a clearer payoff-to-risk ratio.

## Recommended Fix Order

1. Remove startup gating on visible icon preload so Pixi canvas boot is not blocked by texture fetch and decode work.
2. Replace the world clock RAF loop with next-second scheduling that only wakes when the displayed time must advance.
3. Split voice playback inputs away from the broader shell prop path so audio updates do not widen shell rerender fanout.
