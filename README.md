# Survival RPG

Hex-based browser survival RPG built with React, TypeScript, Vite, Pixi.js, Vitest, ESLint, Prettier, and Husky.

## Current State

The project is already a working single-player prototype with a substantial gameplay and UI foundation.

Current implemented areas include:

- Hex world exploration with fog of war and Pixi-based world rendering.
- Day and night progression with blood moon behavior.
- Core survival loop with gathering, inventory, equipment, loot, gold, and town interactions.
- Combat, enemy encounters, progression, recipes, and crafting-related systems.
- Desktop-style draggable windows for hero, skills, hex info, equipment, inventory, recipe book, combat, loot, logs, and docked controls.
- Local autosave with normalization during load to keep save compatibility across shape changes.
- Automated quality tooling with type checking, linting, formatting, tests, and Husky hooks.

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

The repository already has strong baseline tooling. Changes should preserve strict typing, lint cleanliness, and deterministic test coverage where practical.

## Save System Notes

Saves are stored locally and passed through a normalize-before-hydrate step so older save shapes can still be loaded after schema changes.

The current browser-side AES-GCM storage should be treated as local obfuscation, not real security, because the passphrase lives in client code.

## Project Rules

Shared project rules live in `docs/RULES.md`.

AI-facing instruction entrypoints also exist in:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`

Important workflow expectations:

- Future prompts should automatically apply the relevant sections from `docs/RULES.md`.
- If a prompt contains `add rule`, the rule must be added to `docs/RULES.md` immediately and related docs should be updated if needed.
- Use `pnpm`, not `npm`, in contributor guidance and commands.
- Keep gameplay logic in `src/game`, app orchestration in `src/app`, component UI in `src/ui/components`, and Pixi rendering concerns in `src/ui/world`.
- Avoid growing large coordinator files when a focused hook, helper, or domain module is a better fit.
- Keep balancing and world constants configurable instead of scattering hardcoded values through UI code.
- Preserve save normalization when persistence shape changes.
- Protect world-rendering performance and prefer smooth visible transitions where appropriate.

## Prompt Workflow

Prompt templates are documented in `docs/PROMPTS.md`.

That file now assumes that `docs/RULES.md` is part of the default project context for future prompt execution.
