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
- `pnpm dev:server`
- `pnpm dev:storybook`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:node`
- `pnpm test:jsdom`
- `pnpm build`
- `pnpm build:server`
- `pnpm build:budget`
- `pnpm build:visualize`

## Repository Layout

- [`packages/client`](./packages/client/README.md): browser game package, gameplay runtime, Pixi world, persistence, and client-only UI orchestration.
- [`packages/server`](./packages/server/README.md): Node server package, currently exposing `GET /api/version`.
- [`packages/common`](./packages/common/README.md): shared client/server package for future cross-runtime types and utilities.
- [`packages/ui`](./packages/ui/README.md): shared reusable UI component library.
- `docs`: canonical cross-package rules, workflow notes, specs, lore, and transient review material.

## Project References

- Contributor rules: `docs/RULES.md`
- Contributor workflow: `docs/WORKFLOW.md`
- Package docs: `packages/client/README.md`, `packages/server/README.md`, `packages/common/README.md`, `packages/ui/README.md`
- Codex skills index: [`docs/realmfall-skills.md`](./docs/realmfall-skills.md)
- Reference specs: `docs/specs/reference/gameplay-features/README.md` and `docs/specs/reference/technical-solutions/README.md`
- Lore: `docs/lore/REALMFALL.md`
