# Project Review

## Scope

Review based on the current repository contents, configuration, and local validation of the existing scripts.

## Stack Observed

- React 18
- TypeScript 5 with `strict: true`
- Vite 6
- Pixi.js 7
- Vitest
- ESLint 9 flat config
- Prettier 3
- Husky

## Validation Summary

- `pnpm test`: passed, 12 files and 82 tests
- `pnpm typecheck`: passed
- `pnpm build`: passed
- `pnpm lint`: passed with 1 warning
- Build output includes a large chunk warning: main JS bundle is about `791.78 kB` minified

## Pros

- Strong baseline tooling. The repo already has type checking, linting, formatting, tests, and git hooks configured.
- Good TypeScript posture. `tsconfig.json` uses strict mode and modern bundler settings, which is a solid default for a React + Vite codebase.
- Domain logic is heavily test-covered. `src/game/state.test.ts` is extensive and shows good attention to deterministic world generation, combat, progression, and edge cases.
- Configurable gameplay values. `src/game/config.ts` pulls from `game.config.json`, which is a good separation between code and balancing data.
- Persistence has a normalization step before hydration. That is a good practice for save compatibility and future migrations.
- Rendering is separated from game rules. Pixi rendering helpers and game-state functions are not completely mixed together, which gives the project a workable architectural base.
- The project builds cleanly in production today, so this is not just a prototype held together by dev-only assumptions.

## Cons

- `src/app/App/App.tsx` is too large for a React root container at 752 lines. It currently owns hydration, autosave, world time, FPS sampling, keyboard shortcuts, combat timers, loot window transitions, item actions, and most UI orchestration. This increases regression risk and makes state flow harder to reason about.
- `src/game/state.ts` is too large for one domain module at 2758 lines. The file appears to contain world generation, combat, inventory, crafting, economy, progression, logging, and helpers in one place. That reduces navigability and makes future changes harder to isolate and test.
- The save "encryption" is not meaningful security. `src/persistence/storage.ts` uses a hardcoded passphrase (`PASSPHRASE`) in client code, so any user can recover it from the bundle. This is fine as obfuscation, but it should not be treated as real protection.
- Package-manager usage is inconsistent. `package.json` declares `pnpm@10.7.1`, but `README.md` and `.husky/pre-commit` use `npm run ...`. That creates avoidable drift in contributor setup.
- The pre-commit hook only runs `typecheck` and `lint`. It does not run tests or build verification, so a broken runtime or production bundle could still be committed.
- There is no CI workflow in `.github/workflows/`. For a repo with tests and build steps already available, that is a notable process gap.
- The production bundle is large for a browser game of this scale. Vite reports one chunk over the warning threshold, which usually means code splitting and asset-loading strategy need attention.
- Lint is not fully clean. `src/ui/components/windowLabels.tsx` mixes exported non-component helpers in a component-related file and triggers the React Fast Refresh warning.
- The README is too thin for the current complexity. It lists scripts, but does not document setup, architecture, save behavior, gameplay config, testing expectations, or deployment notes.

## Improvements

### High Priority

3. Clarify or redesign persistence security.

- If the goal is convenience only, document it as local save obfuscation, not encryption.
- If tamper resistance matters, move to signed or server-backed persistence; client-only symmetric secrets do not provide real security.

### Medium Priority

5. Reduce bundle size.

- Analyze the bundle and identify the largest contributors.
- Lazy-load non-critical UI windows if practical.
- Review large static assets and whether all of them must ship at initial load.
- Consider manual chunking only after understanding actual bundle composition.

7. Fix the Fast Refresh lint warning.

- Move `WINDOW_LABELS` or `renderWindowLabel` out of `src/ui/components/windowLabels.tsx` into a non-component utility/constants file, or make the file export only one concern.

8. Strengthen test and quality gates.

- The repo already depends on `@vitest/coverage-v8`; either expose a coverage script and document expectations, or remove the unused dependency.
- Consider running tests in pre-push if pre-commit becomes too slow.

### Low Priority

9. Expand the README.

- Add local setup, package manager expectations, architecture overview, save-system notes, and a short explanation of how Pixi and React divide responsibilities.

10. Add explicit performance guidance for the rendering path.

- The Pixi layer is central to user experience. A short internal note about frame-budget expectations, redraw strategy, and asset-loading constraints would help future contributors avoid accidental regressions.

## Overall Assessment

This project has a good technical foundation for an indie browser game: strict TypeScript, passing tests, clear gameplay configuration, and a meaningful amount of automated verification. The biggest gaps are maintainability and delivery maturity rather than correctness. The code works, but the two largest files now carry too much responsibility, the save security story is misleading if interpreted literally, and the repo would benefit from CI, better docs, and bundle optimization.

## Best Next Steps

4. Address bundle size after measuring the biggest contributors.
