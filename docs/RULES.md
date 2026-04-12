# RULES

## Prompt Integration

- Treat this file as shared project guidance for future prompts.
- Automatically apply only the rules that are relevant to the current prompt's scope.
- If a prompt contains an `add rule` statement, update this file immediately in the matching section before considering the task complete.
- When a rule changes project workflow or contributor expectations, reflect that change in `README.md` and adjust `docs/PROMPTS.md` if the prompt templates should change too.

## General

- Use `pnpm` for project commands. Do not switch examples or contributor guidance to `npm`.
- Keep TypeScript strictness, ESLint, Prettier, tests, and Husky hooks working. New changes should not weaken existing quality gates.
- Prefer the smallest correct change that fits the existing structure.
- Preserve existing behavior unless the task explicitly changes behavior.
- Keep gameplay restrictions documented in `docs/RESTRICTIONS.md` in sync with implementation decisions.

## Architecture

- Keep gameplay and simulation rules in `src/game` so they stay testable and mostly UI-independent.
- Keep React app orchestration in `src/app` and presentational UI in `src/ui/components`.
- Keep Pixi world rendering concerns in `src/ui/world` rather than mixing them into gameplay rules.
- Avoid adding more responsibilities to already large orchestration modules such as `src/app/App/App.tsx` and broad domain aggregators such as `src/game/state.ts`; prefer extracting focused hooks, helpers, or domain modules.
- Keep configurable balancing and world values in `game.config.json` or dedicated config modules instead of scattering magic numbers through UI code.

## Persistence

- Preserve the normalize-before-hydrate pattern for save compatibility. If persisted data shape changes, update normalization instead of assuming fresh saves.
- Treat local save protection as obfuscation, not real security. Do not describe client-side passphrase-based storage as secure encryption.
- Keep persistence concerns isolated from core game rules when possible.

## React UI

- Follow the existing window-based desktop-style UI instead of introducing unrelated navigation patterns.
- Keep heavy app coordination in dedicated hooks when possible, following patterns already used in `src/app/App`.
- Lazy-load secondary UI only when it matches the existing usage pattern and helps keep the initial app path lighter.
- Maintain mobile-aware and desktop-safe behavior when changing interactions, even if the full mobile adaptation is still incomplete.

## Pixi And Performance

- Protect frame rate on the world map path. Avoid unnecessary rerenders, reallocation-heavy render steps, and asset churn in Pixi code.
- Prefer extending existing render helpers, caches, math utilities, and pools in `src/ui/world` over duplicating render logic.
- Smooth visual transitions are preferred for color and position changes when they are part of visible world feedback.
- Consider React rerender cost and Pixi redraw cost together for world-facing changes.

## Testing

- Add or update tests for non-trivial gameplay, rendering math, persistence normalization, and bug-fix changes when practical.
- Favor deterministic tests for game-state changes and rendering calculations.
- Keep production buildability in mind, not only local dev behavior.

## Documentation

- Keep `README.md` accurate about the current game state, package manager, save behavior, quality commands, and contributor workflow.
- Keep prompt templates in `docs/PROMPTS.md` aligned with actual project workflow.
- Prefer documenting real project constraints and current behavior over aspirational wording.

## Current Project Constraints

- The game does not support mods.
