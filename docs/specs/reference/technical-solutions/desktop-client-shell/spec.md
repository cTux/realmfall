# Desktop Client Shell

## Scope

This spec covers the shipped Electron desktop shell that hosts the existing web client.

## Current Solution

- `packages/client-electron/src/main.ts` is the production Electron entrypoint.
- `packages/client-electron/src/dev.ts` starts the web Vite dev server and then launches Electron against that existing renderer instead of forking the client UI.
- `packages/client-electron/src/mainProcess.ts` owns app readiness, BrowserWindow creation, and production-only localhost static-server startup.
- `packages/client-electron/src/window.ts` centralizes the BrowserWindow sizing and hardened renderer settings, including `contextIsolation`, disabled renderer `nodeIntegration`, the preload path, and Electron sandboxing.
- `packages/client-electron/src/staticServer.ts` serves the built `packages/client-web/dist` bundle on localhost so the renderer keeps its HTTP-origin assumptions for locale assets and `version.json`.
- `packages/client-electron/src/preload.ts` exposes a minimal isolated bridge and does not enable renderer Node integration.
- The Electron package does not yet implement filesystem-backed saves or Steam Cloud sync.

## Main Implementation Areas

- `packages/client-electron/src/main.ts`
- `packages/client-electron/src/dev.ts`
- `packages/client-electron/src/mainProcess.ts`
- `packages/client-electron/src/window.ts`
- `packages/client-electron/src/staticServer.ts`
- `packages/client-electron/src/preload.ts`
