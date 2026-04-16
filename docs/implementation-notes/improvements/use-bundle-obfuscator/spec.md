# Feature Specification: Production Bundle Obfuscation

**Feature Branch**: `master`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "Use `vite-plugin-bundle-obfuscator` in the project and capture the work as a spec and plan under `docs/specs`."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Harden Production Client Bundles (Priority: P1)

As a release maintainer, I want production JavaScript bundles to be obfuscated so shipped client code is harder to inspect directly while the game still loads and behaves normally.

**Why this priority**: This is the core outcome requested for the feature. Without production obfuscation, there is no user value.

**Independent Test**: Build a production bundle, serve it, and verify the application starts successfully while emitted client bundle contents are no longer in straightforward readable form.

**Acceptance Scenarios**:

1. **Given** a production build is created, **When** the build pipeline finishes, **Then** the emitted client JavaScript that is in scope for hardening is obfuscated.
2. **Given** an obfuscated production build, **When** the game is opened from the built output, **Then** the initial load, world rendering, and core interaction flow still work.

---

### User Story 2 - Preserve Critical Build Stability (Priority: P2)

As a maintainer, I want explicit exclusions and guardrails for chunks that should stay unobfuscated so build output remains stable and framework, vendor, and service-worker-sensitive code is not broken accidentally.

**Why this priority**: Obfuscation is only useful if it does not destabilize the existing bundle strategy or runtime.

**Independent Test**: Configure exclusions, run a production build, and verify excluded chunks remain loadable and the application still boots without chunk resolution errors.

**Acceptance Scenarios**:

1. **Given** the project has manually separated framework and vendor chunks, **When** obfuscation is enabled, **Then** maintainers can keep selected chunks out of obfuscation scope.
2. **Given** a chunk or output type is known to be sensitive to transformation, **When** it is marked as excluded, **Then** the build still completes and the excluded output remains unobstructed by obfuscation.

---

### User Story 3 - Keep the Build Workflow Understandable (Priority: P3)

As a contributor, I want the obfuscation behavior, scope, and limitations to be documented so I can adjust or disable it safely when debugging build issues.

**Why this priority**: This is a build-time protection feature with operational tradeoffs, so maintainability matters.

**Independent Test**: Review the resulting documentation and confirm a contributor can identify when obfuscation runs, what is excluded, and how to change the configuration.

**Acceptance Scenarios**:

1. **Given** a contributor reviews the feature documentation, **When** they inspect the plan and spec, **Then** they can see the intended scope, exclusions, and verification expectations.
2. **Given** build troubleshooting is needed, **When** a contributor changes the obfuscation toggle or exclusion list, **Then** the expected recovery path is clear from the documented plan.

---

### Edge Cases

- What happens when production obfuscation causes unacceptable build-time or memory overhead on the local machine?
- How does the system handle chunks that must stay readable or minimally transformed to avoid runtime breakage?
- What happens if future worker bundles or generated files are introduced and should not automatically inherit the same obfuscation policy?
- How does the system behave when a build runs in development-oriented contexts where obfuscation should not apply?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST apply JavaScript bundle obfuscation only to production build output, not to local development serving.
- **FR-002**: The system MUST preserve successful loading of the built game, including the initial application bootstrap and main world path.
- **FR-003**: The system MUST allow maintainers to exclude specific chunks or output groups from obfuscation when compatibility or stability requires it.
- **FR-004**: The system MUST preserve the existing intentional bundle-splitting strategy rather than collapsing all client code into one obfuscated output.
- **FR-005**: The system MUST provide a clear on/off control for obfuscation in the build configuration so maintainers can troubleshoot regressions quickly.
- **FR-006**: The system MUST document that client-side obfuscation is a deterrence measure and not a security boundary for secrets or save protection.
- **FR-007**: The system MUST keep current quality commands and production buildability working after the feature is introduced.
- **FR-008**: The system MUST define how future sensitive outputs such as worker bundles are treated so they are not silently obfuscated without intent.

### Key Entities _(include if feature involves data)_

- **Obfuscation Policy**: The project-level rule set defining when obfuscation runs, what output is included, and what stays excluded.
- **Exclusion Rule**: A named build output, pattern, or chunk classification that is intentionally left unobfuscated for compatibility or diagnostics.
- **Build Verification Result**: The recorded outcome showing whether production build generation, application startup, and smoke checks still pass with the policy enabled.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A production build completes successfully with obfuscation enabled and without requiring manual post-build edits.
- **SC-002**: A smoke test of the built application confirms successful startup, world render, and at least one basic in-game interaction path.
- **SC-003**: All production JavaScript outputs intended to be protected are emitted in obfuscated form, while explicitly excluded outputs remain unobfuscated.
- **SC-004**: A contributor can identify the obfuscation toggle, exclusion scope, and deterrence-only limitation from the project documentation and spec artifacts without reading plugin source code.

## Assumptions

- The project will keep using Vite production builds as the deployment path for the browser client.
- The current manual chunking strategy for `pixi`, `react-vendor`, and `vendor` remains important and should be preserved.
- Development ergonomics matter more than obfuscating local serve output, so obfuscation remains a production-only concern.
- The project does not rely on client-side obfuscation as real security for secrets, credentials, or save encryption.
