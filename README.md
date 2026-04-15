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
- Automated quality tooling with type checking, linting, formatting, tests, Husky hooks, and CI coverage for typecheck, lint, test, and build.
- Storybook coverage for UI components plus catalog views for items, enemies, and structures.

Current project strengths reflected in the codebase and docs:

- Clear architectural separation between gameplay rules, app orchestration, React windows, and Pixi world rendering.
- Existing React containment patterns such as memoized windows and lazy-loaded secondary UI.
- Window content is expected to stay bundle-split instead of being folded into the initial app path.
- Rendering-specific tests for world math, time-of-day behavior, filters, and cached render behavior.
- Pixi render caches and pools already reuse containers, graphics, sprites, and text instead of recreating display objects each frame.
- Save compatibility handled through normalization before hydration.

The game currently does not support mods. See `docs/RESTRICTIONS.md`.

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
- `docs`: review notes, prompt templates, rules, restrictions, and changelog source data.
- `game.config.json`: configurable gameplay and world values.

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
- `pnpm build:storybook`
- `pnpm serve`
- `pnpm preview`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm test`
- `pnpm test:watch`

## Quality Expectations

Contributors should keep these working unless a task explicitly changes the workflow:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

The repository already has strong baseline tooling. Changes should preserve strict typing, lint cleanliness, deterministic tests where practical, and successful production builds.

## Save System Notes

Saves are stored locally and passed through a normalize-before-hydrate step so older save shapes can still be loaded after schema changes.

The current browser-side AES-GCM storage should be treated as local obfuscation, not real security, because the passphrase lives in client code.

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

## Engineering Expectations

- Use `pnpm` for contributor commands and documentation.
- Keep TypeScript strictness, ESLint, Prettier, tests, Husky hooks, and production builds working.
- Prefer the smallest correct change that fits existing patterns.
- Apply the DRY principle and prefer extending existing shared helpers, components, and config modules over duplicating similar logic.
- When a JavaScript or TypeScript syntax convention should change, prefer enforcing it through an ESLint rule when that is practical.
- Keep gameplay and simulation rules in `src/game`, app orchestration in `src/app`, React UI components in `src/ui/components`, and Pixi world rendering in `src/ui/world`.
- Avoid growing already-large coordinator modules when a focused helper or hook is a better fit.
- Keep balancing and world constants in config or focused modules instead of scattering magic numbers through UI code.
- Keep each unique item, enemy, and structure in its own dedicated configuration file so gameplay and presentation data such as icons, drop or appearance chances, and structure-provided functions stay localized by content type.
- In JavaScript and TypeScript, prefer concise arrow functions for immediate expression returns.
- Keep ESLint style rules aligned with the current JavaScript and TypeScript syntax conventions so the preferred style is enforced automatically when possible.
- Preserve save normalization when persisted shapes evolve.
- Treat browser-side save protection as local obfuscation, not real security.
- Prefer debounced or meaningfully-triggered persistence work over repeated identical writes.
- Keep React component files compatible with Fast Refresh expectations.
- New draggable windows should keep their content behind a lazy-loaded bundle, either by splitting the whole window module or a dedicated `*WindowContent` module.
- Prefer maximally reusable UI primitives. Shared window controls such as close buttons and repeated title-bar actions should come from common components and use the shared custom tooltip behavior consistently.
- Keep Storybook coverage current for every UI component and for aggregate entity catalogs so component and content changes stay visible in reviewable UI fixtures.
- Keep user-facing copy in i18n resources, default to `en`, add new keys instead of inline strings, and use dot-separated keys such as `{feature}.{area}.{property}`.
- For ability, buff, and debuff icons rendered through CSS masks, use transparent SVG assets with no full-canvas background shape so the UI does not show solid squares.
- For UI elements that already use the custom game tooltip system, do not add native browser `title` tooltips. Buffs, debuffs, abilities, and similar interactive affordances should use the shared custom tooltip consistently.
- Prefer deterministic tests for gameplay and render-math changes, especially when performance-sensitive behavior changes.
- Keep generated world content aligned with `docs/lore/REALMFALL.md`.

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

Prompt templates are documented in `docs/PROMPTS.md`.

That file assumes that `docs/RULES.md` is part of the default project context for future prompt execution and that rule changes should be mirrored there when prompt behavior changes.
