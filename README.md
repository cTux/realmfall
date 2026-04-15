# Realmfall

Hex-based browser survival RPG `Realmfall`, built with React, TypeScript, Vite, Pixi.js, Vitest, ESLint, Prettier, and Husky.

Genres: survival RPG, hex-crawl, turn-based exploration, inventory management, roguelite.

## Current State

The project is a working single-player browser prototype with a strong gameplay, rendering, and tooling baseline.

Current implemented areas include:

- Hex world exploration with fog of war and Pixi-based world rendering.
- Day and night progression with blood moon behavior.
- Core survival loop with gathering, inventory, equipment, loot, gold, and town interactions.
- Combat, enemy encounters, progression, recipes, and crafting-related systems.
- Desktop-style draggable windows for hero, skills, hex info, equipment, inventory, recipe book, combat, loot, logs, and docked controls.
- Local autosave with normalization during load to keep save compatibility across shape changes.
- Runtime version exposure, `version.json` build output, and an in-game refresh indicator for newer deployments.
- Automated quality tooling with type checking, linting, formatting, tests, Husky hooks, and CI coverage for typecheck, lint, test, and build.
- Storybook coverage for UI components plus catalog views for items, enemies, and structures.

Current project strengths reflected in the codebase and docs:

- Clear architectural separation between gameplay rules, app orchestration, React windows, and Pixi world rendering.
- Existing React containment patterns such as memoized windows and lazy-loaded secondary UI.
- Window content is expected to stay bundle-split instead of being folded into the initial app path.
- Rendering-specific tests for world math, time-of-day behavior, filters, and cached render behavior.
- Pixi render caches and pools already reuse containers, graphics, sprites, and text instead of recreating display objects each frame.
- Save compatibility handled through normalization before hydration.

The game currently does not support mods.

## Stack

- React 18
- TypeScript with strict compiler settings
- Vite
- Pixi.js
- Vitest
- ESLint
- Prettier
- Husky
- pnpm

## Project Structure

- `src/app`: app orchestration, hydration, persistence wiring, keyboard shortcuts, window coordination, and top-level hooks.
- `src/game`: gameplay rules, combat, economy, crafting, progression, world generation, and shared game types.
- `src/ui/components`: window components and other React UI pieces.
- `src/ui/world`: Pixi/world rendering helpers, render math, caches, atmosphere, and related tests.
- `src/persistence`: local save storage helpers.
- `docs`: review notes, workflow guidance, rules, specs, lore, and changelog source data.
- `game.config.json`: configurable gameplay and world values.

Within feature directories, prefer colocated `hooks/`, `selectors/`, `utils/`, and `tests/` folders for feature-local code. Promote a hook, selector, or utility to `src/hooks`, `src/selectors`, or `src/utils` only when multiple parts of the app share it.

## Setup

Use `pnpm` for all local commands.

```bash
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev`
- `pnpm dev:storybook`
- `pnpm build`
- `pnpm build:budget`
- `pnpm build:storybook`
- `pnpm serve`
- `pnpm preview`
- `pnpm quality:staged`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm lint:css`
- `pnpm format`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm test:watch`

## Quality Expectations

Contributors should keep these working unless a task explicitly changes the workflow:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:css`
- `pnpm test`
- `pnpm build`

For bundle-sensitive changes, also run `pnpm build:budget`.

The pre-commit hook runs `pnpm check:version`, `pnpm typecheck`, and `pnpm quality:staged`, then refreshes the Git index for auto-fixed tracked files. `pnpm quality:staged` runs `eslint --fix` only on staged JavaScript and TypeScript files, runs Stylelint only on staged `src` CSS and SCSS files, and runs `vitest related` for staged source and test files. When shared test inputs such as `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, TypeScript config, or `src/test/setup.ts` are staged, it falls back to the full `pnpm test` suite. `pnpm check:version` still requires `package.json` to advance by patch version relative to `HEAD`.

The repository already has strong baseline tooling. Changes should preserve strict typing, lint cleanliness, deterministic tests where practical, and successful production builds.

## Save System Notes

Saves are stored locally and passed through a normalize-before-hydrate step so older save shapes can still be loaded after schema changes.

The current browser-side AES-GCM wrapper in `src/persistence/storage.ts` should be treated as local obfuscation, not real security, because the passphrase lives in client code.

Autosave and persistence changes should avoid redundant full snapshot work when a debounced or meaningfully-triggered write is sufficient.

## Performance Expectations

The world view is the most performance-sensitive path in the project.

- Avoid avoidable React rerenders caused by high-frequency map interaction state.
- Avoid duplicate world redraw scheduling when the Pixi ticker already owns rendering.
- Prefer React-updated refs or lightweight invalidation flags over a second immediate `renderScene` path when world state changes need to reach Pixi.
- Cache deterministic render inputs when they do not need to be recomputed every frame.
- Prefer separating static and animated render work when it meaningfully reduces redraw cost.
- Extend the existing Pixi pools, caches, and persistent stage layers before adding new allocation-heavy render paths.
- Keep Pixi quality settings device-aware so high-DPI or weaker devices do not quietly pay an excessive frame-time cost.
- Keep bundle growth intentional, especially for Pixi-heavy or secondary UI code.

Lightweight budgets to catch regressions earlier:

- Frame time: treat `16.7 ms` as the default target budget for normal desktop world interaction, including hover, dragging windows, and routine movement, with headroom preferred over running exactly at the limit.
- Startup chunks: treat the current pre-gzip output as the rough ceiling to watch closely, around `235 kB` for the main app chunk, `145 kB` for `react-vendor`, and `435 kB` for `pixi`. New deferred windows and secondary UI should stay deferred instead of increasing the initial path materially.

## Performance Verification

When work changes the performance-sensitive paths, verify the affected area explicitly instead of relying only on correctness checks.

- React rerenders: run `pnpm dev`, open React DevTools Profiler, and inspect window dragging, dock toggles, log changes, and world hover. Unrelated windows or app shells should not rerender repeatedly when only one interaction surface changes.
- Pixi redraw breadth: inspect `src/ui/world/renderScene.ts` while the app is running or in a browser performance recording. Confirm static and interaction redraw paths only execute when their inputs change, while animation-only time updates stay on the animated layer.
- Hover hot paths: profile pointer movement over the world canvas in browser Performance tools or with short-lived instrumentation around `usePixiWorld` hover work. Same-tile pointer moves should not keep retriggering safe-path lookup, tooltip derivation, or other heavier selectors.
- Startup chunk growth: run `pnpm build` and inspect the Vite asset output. Watch the main app, `react-vendor`, and `pixi` chunks, and confirm new draggable windows or secondary UI still ship in deferred chunks instead of inflating the initial path.
- Budget check: compare the new build output and observed frame behavior against the lightweight budgets above. If a change materially exceeds them, document the reason and the follow-up mitigation instead of treating the regression as invisible.

## Engineering Expectations

- Use `pnpm` for contributor commands and documentation.
- Keep TypeScript strictness, ESLint, Prettier, tests, Husky hooks, and production builds working.
- Prefer the smallest correct change that fits existing patterns.
- Apply the DRY principle and prefer extending existing shared helpers, components, and config modules over duplicating similar logic.
- When a JavaScript or TypeScript syntax convention should change, prefer enforcing it through an ESLint rule when that is practical.
- Keep gameplay and simulation rules in `src/game`, app orchestration in `src/app`, React UI components in `src/ui/components`, and Pixi world rendering in `src/ui/world`.
- Avoid growing already-large coordinator modules when a focused helper or hook is a better fit.
- Prefer decomposing broad multi-export modules into focused files unless the file only contains tightly related types or closely related entity or library helpers.
- Keep balancing and world constants in config or focused modules instead of scattering magic numbers through UI code.
- Keep each unique item, enemy, and structure in its own dedicated configuration file so gameplay and presentation data such as icons, drop or appearance chances, and structure-provided functions stay localized by content type.
- In JavaScript and TypeScript, prefer concise arrow functions for immediate expression returns.
- Keep ESLint style rules aligned with the current JavaScript and TypeScript syntax conventions so the preferred style is enforced automatically when possible.
- Preserve save normalization when persisted shapes evolve.
- Treat browser-side save protection in `src/persistence/storage.ts` as local obfuscation, not real security.
- Prefer debounced or meaningfully-triggered persistence work over repeated identical writes.
- Keep React component files compatible with Fast Refresh expectations.
- Keep component and test files under roughly `250` lines when practical by splitting large view, hook, or test concerns into nearby files.
- New draggable windows should keep their content behind a lazy-loaded bundle, either by splitting the whole window module or a dedicated `*WindowContent` module.
- Prefer maximally reusable UI primitives. Shared window controls such as close buttons and repeated title-bar actions should come from common components and use the shared custom tooltip behavior consistently.
- Keep Storybook coverage current for every UI component and for aggregate entity catalogs so component and content changes stay visible in reviewable UI fixtures. Component additions, removals, and behavior-affecting UI changes should update the matching stories in the same task.
- Keep user-facing copy in i18n resources, default to `en`, add new keys instead of inline strings, and use dot-separated keys such as `{feature}.{area}.{property}`.
- For ability, buff, and debuff icons rendered through CSS masks, use transparent SVG assets with no full-canvas background shape so the UI does not show solid squares.
- For UI elements that already use the custom game tooltip system, do not add native browser `title` tooltips. Buffs, debuffs, abilities, and similar interactive affordances should use the shared custom tooltip consistently.
- Prefer deterministic tests for gameplay and render-math changes, especially when performance-sensitive behavior changes. Fixes should add or adjust tests in the same task unless that path is not reasonably testable yet.
- Use `pnpm build:budget` for bundle-sensitive changes so the main `index`, `react-vendor`, and `pixi` chunks stay inside the current startup budget guardrails.
- Keep generated world content aligned with `docs/lore/REALMFALL.md`.
- Keep implemented feature, improvement, and fix specs aligned with shipped behavior in `docs/specs`. New features and improvements should create or update their dedicated spec, and fixes should update the matching requirement when applicable.
- When requested syntax or workflow conventions can be enforced mechanically, update the corresponding lint or formatting config in the same task, including ESLint, Prettier, Stylelint, and Commitlint where applicable.

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

## Prompt Workflow

Workflow guidance is documented in `docs/WORKFLOW.md`.

That file assumes that `docs/RULES.md` is part of the default project context for future prompt execution and that workflow changes should be mirrored there when contributor expectations change.
