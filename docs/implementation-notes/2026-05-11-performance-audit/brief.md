# 2026-05-11 Performance Audit Brief

## Scope

- Repo: `realmfall`
- Audit focus: client runtime hot paths, Pixi world interaction overhead, settings-window rerender churn, and current production bundle shape
- Evidence gathered from source review plus a fresh `pnpm --filter @realmfall/client-web build` on 2026-05-11

## Current Build Snapshot

- `assets/js/pixi-DXyMWTIn.js`: `514.32 kB` (`146.96 kB` gzip)
- `assets/js/state-5Ye1ezI2.js`: `391.46 kB` (`93.58 kB` gzip)
- `assets/js/gameplayIconAssets-CbQ2bwfk.js`: `170.11 kB` (`67.15 kB` gzip)
- `assets/js/App-CzwqEOPN.js`: `114.64 kB` (`35.02 kB` gzip)
- `assets/js/renderScene-K_noZBn-.js`: `40.42 kB` (`13.73 kB` gzip)

## Findings

1. `packages/client-web/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts` uses `JSON.stringify` for every hovered-slice tile and enemy signature during refresh checks. That makes each hover-analysis invalidation walk allocate and serialize the full nearby slice before the worker sync decision is even made.

2. `packages/client-web/src/app/App/world/pixiWorldHoverInteractions.ts` refreshes hover analysis by dispatching a synthetic `pointermove` event back through the canvas listener stack. The controller already has the pointer coordinates and the local processing path, so the extra DOM event path adds avoidable work and couples refresh logic to input dispatch.

3. `packages/client-web/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.tsx` derives `dirty` by stringifying four settings objects on every render. That is unnecessary churn in an interactive settings surface and scales poorly as the settings schema grows.

## Confirmed Current State

- The eager performance-harness import issue from the earlier audit is no longer present on the normal app path.
- The root `@realmfall/ui-react` eager-path bundle issue from the earlier audit is no longer present in `AppShell`; the current app entry imports narrow shared UI subpaths.
- The large `state` chunk remains, but the current audit did not find a single low-risk split worth mixing into this pass. Treat that as a separate architecture project instead of a tactical fix.

## Recommended Fix Order

1. Optimize hover-analysis slice diffing so worker refresh checks stay cheap.
2. Remove synthetic-event redispatch from hover refresh and keep the work inside the controller.
3. Replace settings dirty-check stringification with explicit equality helpers.
