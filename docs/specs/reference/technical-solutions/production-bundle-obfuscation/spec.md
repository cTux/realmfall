# Production Bundle Obfuscation

## Scope

This spec covers the release-only JavaScript bundle obfuscation policy used by the production Vite build.

## Current Solution

- The repository ships `vite-plugin-bundle-obfuscator` in the shared Vite config and applies it only during production `pnpm build` output generation.
- Obfuscation stays enabled by default for release builds, but maintainers can disable it quickly with `REALMFALL_ENABLE_BUNDLE_OBFUSCATOR=false` when troubleshooting a production build regression.
- The Vite config uses a lightweight obfuscation profile that keeps identifier and control-flow transformation conservative enough to preserve the repository's startup chunk budget checks.
- The policy keeps the existing manual chunk strategy intact by excluding the current framework and runtime-sensitive chunks: `pixi`, `pixiRuntime`, `react-core`, `react-dom-vendor`, `rolldown-runtime`, and `vendor`.
- Service-worker-related JavaScript outputs stay unobfuscated by default, including `registerSW.js`, `sw.js`, and generated `workbox-*.js` files.
- Web Worker bundle obfuscation remains disabled until the project adds worker outputs and verifies them intentionally.
- Obfuscation is treated as a client-side deterrence measure only. It does not provide a security boundary for secrets, credentials, or local save protection.
- Bundle-policy changes must still preserve startup chunk budgets and boot cleanly from the built `dist` output.

## Main Implementation Areas

- `package.json`
- `pnpm-lock.yaml`
- `vite.config.ts`
- `README.md`
- `docs/rules/50-build-and-bundle.md`
- `docs/WORKFLOW.md`
