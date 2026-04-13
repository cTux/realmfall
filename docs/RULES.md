# RULES

## Prompt Integration

- Treat this file as shared project guidance for future prompts.
- Automatically load and apply only the rules that are relevant to the current prompt's scope.
- Future prompts should assume these relevant rules are already part of their working context, even when the prompt only references a task area indirectly.
- If a prompt contains an `add rule` statement, update this file immediately in the matching section before considering the task complete.
- If a prompt contains an optimization request, update the relevant rules when the project guidance should change, not only the implementation.
- When a rule changes project workflow or contributor expectations, reflect that change in `README.md` and adjust `docs/PROMPTS.md` if the prompt templates should change too.
- Keep AI-specific instruction entrypoints such as `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` aligned with this file when shared prompt behavior changes.
- Use `docs/PROJECT_REVIEW.md` and `docs/PROMPTS.md` as inputs when refining recurring project rules, but keep this file as the canonical rules source.

## General

- Use `pnpm` for project commands. Do not switch examples or contributor guidance to `npm`.
- Keep TypeScript strictness, ESLint, Prettier, tests, and Husky hooks working. New changes should not weaken existing quality gates.
- Prefer the smallest correct change that fits the existing structure.
- Preserve existing behavior unless the task explicitly changes behavior.
- Favor existing project patterns over introducing new abstractions, state layers, or architectural styles without a clear need.
- Keep documentation grounded in the current shipped behavior and known constraints, not aspirational plans.
- Keep gameplay restrictions documented in `docs/RESTRICTIONS.md` in sync with implementation decisions.
- When generating or naming world content such as places, factions, enemies, items, events, structures, or flavor text, align it with the established lore in `docs/lore/REALMFALL.md`.

## Architecture

- Keep gameplay and simulation rules in `src/game` so they stay testable and mostly UI-independent.
- Keep React app orchestration in `src/app` and presentational UI in `src/ui/components`.
- Keep Pixi world rendering concerns in `src/ui/world` rather than mixing them into gameplay rules.
- Avoid adding more responsibilities to already large orchestration modules such as `src/app/App/App.tsx` and broad domain aggregators such as `src/game/state.ts`; prefer extracting focused hooks, helpers, or domain modules.
- Keep configurable balancing and world values in `game.config.json` or dedicated config modules instead of scattering magic numbers through UI code.
- Prefer extending existing helpers, caches, and domain modules before adding parallel systems that solve the same problem differently.

## Persistence

- Preserve the normalize-before-hydrate pattern for save compatibility. If persisted data shape changes, update normalization instead of assuming fresh saves.
- Treat local save protection as obfuscation, not real security. Do not describe client-side passphrase-based storage as secure encryption.
- Keep persistence concerns isolated from core game rules when possible.
- Prefer debounced or meaningfully-triggered autosave work over repeated full serialization and storage writes on every eligible change.
- Avoid rewriting identical save payloads when no persisted state meaningfully changed.

## React UI

- Follow the existing window-based desktop-style UI instead of introducing unrelated navigation patterns.
- Keep heavy app coordination in dedicated hooks when possible, following patterns already used in `src/app/App`.
- Lazy-load secondary UI only when it matches the existing usage pattern and helps keep the initial app path lighter.
- Treat draggable window content as secondary UI by default. New windows should defer their content behind a lazy-loaded bundle, either by lazy-loading the whole window module or by lazy-loading a dedicated `*WindowContent` module inside the window component.
- Preserve existing React containment patterns such as memoized window components when extending the current UI.
- Maintain mobile-aware and desktop-safe behavior when changing interactions, even if the full mobile adaptation is still incomplete.
- Keep high-frequency pointer, hover, and world-interaction updates off broad React state paths when refs, invalidation flags, or narrower state can avoid avoidable rerenders.
- Keep component modules compatible with React Fast Refresh expectations; move shared non-component exports out of component files when needed.
- Keep shared window labels, hotkey metadata, and similar reusable UI constants in plain non-component modules so component files only export component concerns.

## Pixi And Performance

- Protect frame rate on the world map path. Avoid unnecessary rerenders, reallocation-heavy render steps, and asset churn in Pixi code.
- Prefer extending existing render helpers, caches, math utilities, and pools in `src/ui/world` over duplicating render logic.
- Preserve and extend the existing pooling and persistent-stage-layer approach before introducing new world-render allocation paths.
- Smooth visual transitions are preferred for color and position changes when they are part of visible world feedback.
- Consider React rerender cost and Pixi redraw cost together for world-facing changes.
- Prefer a single clear render scheduler for the world path. Avoid duplicate immediate redraw triggers layered on top of the ticker unless there is a measured reason.
- When React-driven world state changes need a redraw, prefer updating refs or lightweight invalidation flags that the ticker consumes instead of adding a second immediate `renderScene` effect path.
- Cache deterministic per-tile or per-scene render inputs instead of recomputing stable randomness and presentation values every frame.
- Separate static world layers from animated or transient layers when doing so reduces repeated redraw cost without making the renderer harder to reason about.
- Keep world-map terrain geometry, fog, ground cover, and stable structure or enemy markers on cached static Pixi layers. Do not redraw unchanged map geometry on every ticker frame just because time-based animation is advancing.
- Put hover, selection, and other short-lived interaction highlights on their own invalidated layer so pointer-state changes do not force a rebuild of the full world scene.
- Reserve per-frame ticker redraws for genuinely animated layers such as clouds, atmosphere, overlays, firelight, and similar time-driven effects; static layers should refresh only when their actual inputs change.
- Use device-aware quality budgets for Pixi rendering. Cap expensive defaults such as full-resolution rendering or unconditional antialiasing when they threaten frame time on weaker or high-DPI devices.
- Prefer small, focused render tests for world math, lighting, filters, caches, and deterministic presentation behavior when changing Pixi logic.

## Build And Bundle

- Keep the production bundle intentional. Avoid pushing heavy world-only or secondary UI code onto the initial path when existing lazy-loading or chunking patterns can keep it deferred.
- When adding a new draggable window, preserve bundle splitting for its content instead of inlining that content into the initial app path.
- Prefer targeted code splitting for heavier dependencies instead of collapsing all third-party code into one growing vendor chunk.
- Treat bundle growth as a real performance cost, especially on the initial app path and in Pixi-heavy features.

## Testing

- Add or update tests for non-trivial gameplay, rendering math, persistence normalization, and bug-fix changes when practical.
- Favor deterministic tests for game-state changes and rendering calculations.
- Keep production buildability in mind, not only local dev behavior.
- When performance-sensitive behavior changes, verify both correctness and the likely rerender or redraw impact.

## Documentation

- Keep `README.md` accurate about the current game state, package manager, save behavior, quality commands, and contributor workflow.
- Keep prompt templates in `docs/PROMPTS.md` aligned with actual project workflow.
- Prefer documenting real project constraints and current behavior over aspirational wording.
- When prompts establish recurring workflow expectations, capture them here so future prompt handling stays consistent.
- Keep rule and workflow updates synchronized across `README.md`, `docs/PROMPTS.md`, and the AI-specific instruction files when those updates affect future prompt execution.
- Keep lore-sensitive guidance aligned with the canonical world reference in `docs/lore/REALMFALL.md`.

## Current Project Constraints

- The game does not support mods.
