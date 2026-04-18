# Implementation Plan: Production Bundle Obfuscation

**Branch**: `master` | **Date**: 2026-04-13 | **Brief**: [brief.md](./brief.md)  
**Input**: Feature brief from `docs/implementation-notes/improvements/use-bundle-obfuscator/brief.md`

**Note**: This plan follows the GitHub Spec Kit planning structure while targeting the repo-specific `docs/specs/...` convention used by this project.

## Summary

Introduce production-only client bundle obfuscation through `vite-plugin-bundle-obfuscator`, integrated into the existing Vite build without changing development serve behavior. Keep the current chunking strategy intact, exclude framework- and runtime-sensitive outputs where needed, and verify the built game still boots and renders correctly.

## Technical Context

**Language/Version**: TypeScript 6.0.x, Node-based Vite build configuration  
**Primary Dependencies**: Vite 8.0.x, React 19.2.x, Pixi.js 8.18.x, `vite-plugin-bundle-obfuscator`  
**Storage**: N/A  
**Testing**: `pnpm build`, `pnpm test`, `pnpm lint`, targeted smoke verification of built output  
**Target Platform**: Browser client built with Vite for production deployment  
**Project Type**: Web application  
**Performance Goals**: Preserve acceptable production build time while avoiding runtime regressions on the initial load and world map path  
**Constraints**: Use `pnpm`; keep development flow unobfuscated; preserve manual chunking; treat obfuscation as deterrence only; avoid destabilizing PWA or future worker outputs  
**Scale/Scope**: Single existing Vite config, one browser client, a handful of intentional vendor chunks plus application chunks

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- `docs/RULES.md` General: keep the smallest correct change, preserve current behavior, and keep quality gates working.
- `docs/RULES.md` Build And Bundle: keep the production bundle intentional and preserve targeted code splitting instead of flattening chunk structure.
- `docs/RULES.md` Persistence: document obfuscation as protection-through-obscurity, not real encryption or secrets security.
- `docs/RULES.md` Testing: verify production buildability and check the likely runtime impact of any build transformation.

Gate result: Pass, provided the implementation remains production-only, preserves manual chunks, and includes a built-output smoke check.

## Project Structure

### Documentation (this feature)

```text
docs/implementation-notes/improvements/use-bundle-obfuscator/
|-- brief.md
|-- plan.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
vite.config.ts
package.json
README.md
docs/WORKFLOW.md
docs/rules/50-build-and-bundle.md
docs/specs/reference/technical-solutions/production-bundle-obfuscation/spec.md
```

**Structure Decision**: Keep the implementation focused in `vite.config.ts` with the supporting dependency and documentation updates alongside it. No new runtime architecture or build subsystem is needed.

## Phase 0: Research Decisions

### Decision 1: Run obfuscation only for production builds

- **Decision**: Apply the obfuscator only on build output.
- **Rationale**: This avoids harming local iteration speed and matches the requested protection target.
- **Alternatives considered**: Obfuscating serve output was rejected because it would degrade development ergonomics for no release benefit.

### Decision 2: Preserve explicit exclusions for sensitive chunks

- **Decision**: Start with exclusions for chunks that are most likely to be compatibility-sensitive, then broaden only if build and smoke verification remain stable.
- **Rationale**: The project already has intentional `react-core`, `react-dom-vendor`, `pixi`, and `vendor` chunking, plus small runtime helper chunks. Obfuscation should not blindly transform every output without validation.
- **Alternatives considered**: Obfuscating every emitted JavaScript file by default was rejected because it creates higher regression risk around framework/runtime chunks.

### Decision 3: Do not enable worker obfuscation unless workers are introduced intentionally

- **Decision**: Leave worker-specific obfuscation disabled unless the project later adds worker bundles and explicitly verifies them.
- **Rationale**: The current codebase does not use Vite workers, so enabling worker handling now adds risk without value.
- **Alternatives considered**: Enabling worker obfuscation preemptively was rejected because it would create an unverified policy for outputs that do not exist today.

## Phase 1: Design

1. Add `vite-plugin-bundle-obfuscator` as a dev dependency with `pnpm`.
2. Integrate the plugin into `vite.config.ts` as a production-only plugin.
3. Configure exclusions to avoid destabilizing known framework, runtime, and service-worker-sensitive chunks on the first pass.
4. Keep the existing `manualChunks` strategy intact.
5. Add concise documentation where needed so contributors understand the toggle, scope, and deterrence-only limitation.

## Verification Plan

1. Run `pnpm build` and confirm the production bundle completes.
2. Inspect emitted JavaScript outputs to confirm in-scope bundles are obfuscated and excluded bundles are not.
3. Run the built client locally and verify startup, initial world render, and a basic interaction path.
4. Run `pnpm test`, `pnpm lint`, and `pnpm build:budget` because the integration changes shared build configuration and bundle policy.

## Risks And Mitigations

- **Risk**: Obfuscation may break chunk loading or framework runtime behavior.  
  **Mitigation**: Start with a conservative exclusion policy and expand only after smoke verification.

- **Risk**: Build time or memory usage may increase noticeably.  
  **Mitigation**: Use the plugin's thread-pool support only if needed and keep the ability to disable obfuscation quickly.

- **Risk**: Contributors may mistake obfuscation for real security.  
  **Mitigation**: Document explicitly that this is only a client-side deterrence measure.

## Complexity Tracking

No constitution violations are expected. The feature is a focused build-configuration enhancement and should stay within the existing Vite config structure.
