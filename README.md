# Realmfall

Single-player browser survival RPG `Realmfall` with hex exploration, turn-based systems, React UI, and Pixi.js world rendering.

Genres: survival RPG, hex-crawl, turn-based exploration, inventory management, roguelite.

## Current State

The project is a working single-player browser prototype with a strong gameplay, rendering, and tooling baseline.

Current implemented areas include:

- Hex world exploration with fog of war and Pixi-based world rendering.
- Day and night progression with blood moon behavior.
- Core survival loop with gathering, inventory, equipment, loot, gold, and town interactions.
- Combat, enemy encounters, progression, recipes, and crafting-related systems.
- Desktop-style draggable windows for hero, skills, hex info, equipment, inventory, recipe book, combat, loot, logs, and docked controls.
- Local autosave with direct hydration of the current save shape.
- Runtime version exposure, `version.json` build output, and an in-game refresh indicator for newer deployments.
- Automated quality tooling with type checking, linting, formatting, tests, Husky hooks, and CI coverage for typecheck, lint, test, and build.
- Storybook coverage for UI components plus catalog views for items, enemies, and structures.

Current project strengths reflected in the codebase and docs:

- Clear architectural separation between gameplay rules, app orchestration, React windows, and Pixi world rendering.
- Existing React containment patterns such as memoized windows and lazy-loaded secondary UI.
- Window content is expected to stay bundle-split instead of being folded into the initial app path.
- Rendering-specific tests for world math, time-of-day behavior, filters, and cached render behavior.
- Pixi render caches and pools already reuse containers, graphics, sprites, and text instead of recreating display objects each frame.
- Save hydration currently expects the active runtime save shape and does not migrate older save formats.

The game currently does not support mods.

## Stack

- React 19
- TypeScript with strict compiler settings
- Vite
- Pixi.js
- Vitest
- Oxlint
- Prettier
- Husky
- pnpm

## Project Structure

- `src/app`: app orchestration, hydration, persistence wiring, keyboard shortcuts, window coordination, and top-level hooks.
- `src/game`: gameplay rules, combat, economy, crafting, progression, world generation, and shared game types.
- `src/ui/components`: window components and other React UI pieces.
- `src/ui/world`: Pixi/world rendering helpers, render math, caches, atmosphere, and related tests.
- `src/persistence`: local save storage helpers.
- `docs`: review notes, workflow guidance, scoped rules, specs, lore, and changelog source data.
- `game.config.json`: configurable gameplay and world values.

Within feature directories, prefer colocated `hooks/`, `selectors/`, `utils/`, and `tests/` folders for feature-local code. Promote a hook, selector, or utility to `src/hooks`, `src/selectors`, or `src/utils` only when multiple parts of the app share it.

## Setup

Use `pnpm` for all local commands.
Use Node `v25` (the repository pin lives in `.nvmrc`).
Use `pnpm` `10.x` (`packageManager` currently pins `10.33.0`).

```bash
pnpm install
pnpm dev
```

## Package Metadata

- Package name: `realmfall`
- License: `UNLICENSED`
- Repository: `git@github.com:cTux/realmfall.git`
- Homepage and issue tracker: `https://github.com/cTux/realmfall`

## Scripts

- `pnpm dev` (runs the Vite dev server over local HTTPS with the shared localhost certificate)
- `pnpm dev:storybook`
- `pnpm build`
- `pnpm build:budget`
- `pnpm build:storybook`
- `pnpm git:prune-gone-branches` (fetches with prune, then force-deletes local branches whose tracked remote ref no longer exists; pass `-- --dry-run` to preview and `-- --safe` to keep Git's merged-branch safety checks)
- `pnpm git:rebase-master-and-push` (rebases the current committed branch onto `origin/master`, auto-resolves `package.json` version conflicts by replaying this branch's patch-version increments, then force-pushes with lease to `origin/<current-branch>`; pass `-- --dry-run` to preview the workflow)
- `pnpm serve` (serves `dist` over local HTTPS with a generated self-signed certificate)
- `pnpm preview`
- `pnpm quality:staged`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm lint:oxlint`
- `pnpm lint:css`
- `pnpm format`
- `pnpm test`
- `pnpm test:memory:leaks` (starts the HTTPS Vite dev server and runs `fuite` against `https://localhost:5173` with a dock-window toggle scenario, writing JSON output to `.tests/memory-leaks/latest.json`)
- `pnpm test:coverage`
- `pnpm test:watch`

`pnpm test` now uses `@raegen/vite-plugin-vitest-cache` and stores reusable Vitest
results in `.tests/vitest-cache`. The directory is project-local, ignored by
Git, and restored in CI so warm reruns can reuse unaffected test results.

## Quality Expectations

Contributors should keep these working unless a task explicitly changes the workflow:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:css`
- `pnpm test`
- `pnpm test:memory:leaks` when checking SPA route or listener retention with `fuite`
- `pnpm build`

For bundle-sensitive changes, also run `pnpm build:budget`.

If you need a cold test run, delete `.tests/vitest-cache` and rerun `pnpm test`.
If the directory does not exist yet, `pnpm test` falls back to a normal run and
recreates it.

`pnpm lint` now runs Oxlint as the only JavaScript and TypeScript lint path in the repository. `pnpm lint:fix` and `pnpm lint:oxlint` use the same Oxlint target set directly.

The pre-commit hook runs `pnpm check:version`, `pnpm typecheck`, and `pnpm quality:staged`, then refreshes the Git index for auto-fixed tracked files. `pnpm quality:staged` runs `oxlint --fix -c .oxlintrc.json` only on staged JavaScript and TypeScript files, runs Stylelint only on staged `src` CSS and SCSS files, and runs `vitest related` for staged source, runtime JSON content, and test files. When shared test inputs such as `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, TypeScript config, or `src/test/setup.ts` are staged, it falls back to the full `pnpm test` suite. Before creating a commit, bump the patch version in `package.json`; `pnpm check:version` requires that patch version to advance relative to `HEAD`.

The repository already has strong baseline tooling. Changes should preserve strict typing, lint cleanliness, deterministic tests where practical, and successful production builds.

Review notes and improvement descriptions should describe the current behavior directly rather than leaning on comparative filler such as `still`, because that wording goes stale once follow-up fixes land.

## Project Rules

Shared project rules live in `docs/RULES.md`.

World lore lives in `docs/lore/REALMFALL.md`.

Implementation-facing specs live in `docs/specs`, with current reference specs in:

- `docs/specs/reference/gameplay-features/README.md`
- `docs/specs/reference/technical-solutions/README.md`

AI-facing instruction entrypoints also exist in:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`

Workflow expectations are defined in `docs/RULES.md`. Keep this file concise and update the canonical rules there first.
