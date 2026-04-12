# Survival RPG

Hex-based browser survival RPG built with React, TypeScript, Vite, Pixi.js, Vitest, ESLint, Prettier, and Husky.

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

Current project strengths reflected in the codebase and docs:

- Clear architectural separation between gameplay rules, app orchestration, React windows, and Pixi world rendering.
- Existing React containment patterns such as memoized windows and lazy-loaded secondary UI.
- Rendering-specific tests for world math and time-of-day behavior.
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
- `docs`: review notes, prompt templates, rules, restrictions, and backlog documents.
- `game.config.json`: configurable gameplay and world values.

## Setup

Use `pnpm` for all local commands.

```bash
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev`
- `pnpm build`
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
- Keep Pixi quality settings device-aware so high-DPI or weaker devices do not quietly pay an excessive frame-time cost.
- Keep bundle growth intentional, especially for Pixi-heavy or secondary UI code.

## Project Rules

Shared project rules live in `docs/RULES.md`.

AI-facing instruction entrypoints also exist in:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`

Important workflow expectations:

- Future prompts should automatically apply the relevant sections from `docs/RULES.md`.
- Relevant rules should be treated as default context for future prompts, even when they are not repeated explicitly.
- If a prompt contains `add rule`, the rule must be added to `docs/RULES.md` immediately and related docs should be updated if needed.
- Use `pnpm`, not `npm`, in contributor guidance and commands.
- Keep gameplay logic in `src/game`, app orchestration in `src/app`, component UI in `src/ui/components`, and Pixi rendering concerns in `src/ui/world`.
- Avoid growing large coordinator files when a focused hook, helper, or domain module is a better fit.
- Keep balancing and world constants configurable instead of scattering hardcoded values through UI code.
- Preserve save normalization when persistence shape changes.
- Treat browser-side save encryption language as obfuscation unless the security model changes.
- Prefer debounced or meaningfully-triggered autosave work over repeated identical writes.
- Protect world-rendering performance and prefer smooth visible transitions where appropriate.
- Avoid high-frequency world interaction state flowing through broad React state when a narrower path is sufficient.
- Prefer one clear world render scheduler and intentional caching for deterministic render inputs.
- On the Pixi world path, prefer ticker-owned rendering with refs or invalidation flags instead of duplicate React effect redraws.

## Prompt Workflow

Prompt templates are documented in `docs/PROMPTS.md`.

That file assumes that `docs/RULES.md` is part of the default project context for future prompt execution and that rule changes should be mirrored there when prompt behavior changes.
