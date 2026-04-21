# Issue Brief: Historical `usePixiWorld` Import Warning Snapshot

**Captured**: 2026-04-13  
**Status**: Historical note  
**Last reviewed**: 2026-04-21

This brief preserves a planning-only snapshot from 2026-04-13, when
`pnpm build` reported ineffective dynamic-import warnings from
`src/app/App/usePixiWorld.ts`.

The warning group captured in that session referenced:

- `src/game/state.ts`
- `src/ui/tooltips.ts`
- `src/ui/world/timeOfDay.ts`
- `src/ui/world/renderSceneMath.ts`

The original session reverted an experiment, recorded the warning inventory,
and stopped without changing shipped runtime behavior.

Use this note only as historical context. Before acting on it, rerun
`pnpm build` and confirm the live warning set, because current build output may
differ from the 2026-04-13 snapshot.
