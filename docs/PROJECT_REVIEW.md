# Project Review

## Pros

- The project keeps a solid quality baseline. `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build:budget` all pass, and Husky runs the same gate set before commits land.
- The browser delivery path is deliberate. `vite.config.ts` keeps `pixi`, `react-vendor`, and the remaining vendor code split apart, while the new `scripts/check-bundle-budget.mjs` guard keeps the main startup chunks inside an enforced budget during local verification and in `.github/workflows/pull-request.yml`.
- React app orchestration is more focused than it was. `src/app/App/useAppControllers.ts`, `src/app/App/useAppGameView.ts`, `src/app/App/useWindowTransitions.ts`, and the focused hooks under `src/app/App/hooks` now hold most controller, selector, transition, and window-view logic instead of expanding `App.tsx` and `AppWindows.tsx` further.
- Window shells are consistently reused. `src/ui/components/WindowShell.tsx` and the lazy window loaders keep the floating desktop UI aligned on the same shell contract instead of repeating per-window wrapper code.
- The world renderer has a stronger hot-path split. `src/ui/world/renderScene.ts` now keeps animation-only frames on cached campfire inputs and avoids full visible-tile traversal when static and interaction layers do not need rebuilding.
- Pointer and tooltip handling are already deduplicated on the hot path. `src/app/App/usePixiWorld.ts` caches hover snapshots by hex, keeps hover state in refs, and updates follow-cursor tooltips from the existing Pixi pointer pipeline instead of routing those updates through broad React state.
- The Pixi scene foundation is still strong. `src/ui/world/renderSceneCache.ts` and `src/ui/world/renderScenePools.ts` keep persistent layers, pooled objects, and bounded cloud-input caching in place for future optimizations.
- Save handling and compatibility remain disciplined. `src/app/normalize.ts` and `src/app/App/useAppPersistence.ts` protect older saves and avoid redundant writes.
- The test suite covers meaningful gameplay and rendering paths. `src/ui/world/renderScene.test.ts`, `src/game/state.test.ts`, `src/app/App/App.test.tsx`, and related UI tests give good regression coverage for this stack.

## Cons

- `src/game/state.ts` is still a very large module, which keeps too many gameplay mutations and selectors behind one ownership boundary.
- `src/app/App/App.tsx` remains a broad composition root. The heavy derivation has been reduced, but the root still wires many gameplay, persistence, world, and window concerns together in one component.
- `src/ui/components/LogWindow/LogWindowContent.tsx` still uses a timer-driven reveal for the newest log entry. It is only one interval now, not one per row, but it is still work that scales with message length rather than staying purely declarative.
- Initial startup cost is now guarded, but the startup path is still non-trivial. The current enforced bundle envelope still allows roughly `240 kB` for `index`, `150 kB` for `react-vendor`, and `440 kB` for `pixi` before gzip.
- Browser-side save protection is still obfuscation, not security. `src/persistence/storage.ts` ships the material needed to derive the same client-side key.

## Improvements

### High Priority

- Split `src/game/state.ts` into narrower gameplay domains.
  Pull combat, inventory, world interaction, and progression mutations into dedicated modules so changes do not keep accumulating in one file.

- Keep shrinking the `App.tsx` composition surface.
  Move additional root-level wiring and cross-cutting UI assembly into focused hooks or adapters so the root stays readable as the game surface grows.

### Medium Priority

- Revisit newest-log animation if the log window grows more complex.
  The current approach is acceptable, but a shared clock or CSS-driven reveal would age better if more animated log behavior is added.

- Keep adding hot-path regression coverage where profiling has already identified risk.
  Hover-frequency, drag, and world-redraw tests are better than before, and they should keep growing alongside optimization work.

- Recalibrate bundle budgets when the chunk strategy changes materially.
  The current thresholds are now enforced, but they should stay tied to intentional delivery decisions instead of becoming stale numbers.

### Low Priority

- Tighten wording around local save protection in contributor-facing docs.
  Describe the current storage path as local obfuscation unless the trust model changes.

- Keep contributor performance guidance aligned with real verification commands.
  `docs/RULES.md` and `docs/WORKFLOW.md` now describe the current review path; keep those instructions synchronized with the actual profiling and build commands.
