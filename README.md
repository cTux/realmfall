# Realmfall

Single-player browser survival RPG `Realmfall` with hex exploration, turn-based systems, React UI, and Pixi.js world rendering.

## Current State

Realmfall is an active browser prototype with hex exploration, survival systems, turn-based combat, crafting, draggable desktop-style windows, Pixi world rendering, local autosave, Storybook-covered UI, and automated quality gates.

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

## Setup

Use `pnpm` for all local commands and Node `v25.9.0` from `.nvmrc`.

```bash
pnpm install
pnpm dev
```

## Common Commands

- `pnpm dev`
- `pnpm dev:storybook`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:css`
- `pnpm test`
- `pnpm build`
- `pnpm build:budget`

## Repository Layout

- `src/app`: app orchestration, hydration, persistence wiring, keyboard shortcuts, window coordination, and top-level hooks.
- `src/game`: gameplay rules, combat, economy, crafting, progression, world generation, and shared game types.
- `src/ui/components`: React windows and shared UI components.
- `src/ui/world`: Pixi world rendering helpers, caches, and related tests.
- `src/persistence`: local save storage helpers.
- `docs`: canonical rules, workflow notes, specs, lore, and transient review material.

## Project References

- Contributor rules: `docs/RULES.md`
- Contributor workflow: `docs/WORKFLOW.md`
- Reference specs: `docs/specs/reference/gameplay-features/README.md` and `docs/specs/reference/technical-solutions/README.md`
- Lore: `docs/lore/REALMFALL.md`
