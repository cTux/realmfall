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

`pnpm dev` launches the client and `server-world` local HTTPS dev runtimes together. Start `server-auth` and `server-chat` separately through their filtered package commands when you need auth or chat flows locally.

## Common Commands

- `pnpm dev`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Repository Layout

- [`packages/client`](./packages/client/README.md): browser game package for the React app shell, Pixi world rendering, persistence, and client-only UI orchestration.
- [`packages/common`](./packages/common/README.md): shared cross-runtime contracts package for movement and world-tile resolution requests and responses.
- [`packages/core`](./packages/core/README.md): canonical gameplay simulation and shared world model used by the client, tests, and future server-side runtime code.
- [`packages/server-auth`](./packages/server-auth/README.md): standalone Node auth service package for Google player verification and realm-directory responses.
- [`packages/server-chat`](./packages/server-chat/README.md): standalone Node chat service package for recent message history and websocket availability notifications.
- [`packages/server-world`](./packages/server-world/README.md): Node world-service package, currently exposing `GET /api/version`.
- [`packages/ui`](./packages/ui/README.md): shared reusable React UI component library.
- `docs`: canonical cross-package rules, workflow notes, specs, lore, and transient review material.

## Project References

- Contributor rules: `docs/RULES.md`
- Contributor workflow: `docs/WORKFLOW.md`
- Package docs: `packages/client/README.md`, `packages/common/README.md`, `packages/core/README.md`, `packages/server-auth/README.md`, `packages/server-chat/README.md`, `packages/server-world/README.md`, `packages/ui/README.md`
- Codex skills index: [`docs/realmfall-skills.md`](./docs/realmfall-skills.md)
- Reference specs: `docs/specs/reference/gameplay-features/README.md` and `docs/specs/reference/technical-solutions/README.md`
- Lore: `docs/lore/REALMFALL.md`

## Specs By Package

- `packages/client`: `application-architecture`, `react-app-orchestration`, `pixi-rendering-solution`, `persistence-and-save-compatibility`
- `packages/common`: `async-world-tile-resolution`, `movement-cooldown`
- `packages/core`: gameplay-features index, `combat-system-implementation`, `content-ids-and-tags`, `internationalization`
- `packages/server-auth`: `player-auth-and-realm-directory`
- `packages/server-chat`: `chat-service`
- `packages/server-world`: `version-checking`
- `packages/ui`: `ui-component-library`, `input-and-tooltip-handling`, `internationalization`
