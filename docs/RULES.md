# RULES

## Prompt Integration

- Treat this file as shared project guidance for future prompts.
- Automatically load and apply only the rules that are relevant to the current prompt's scope.
- Future prompts should assume these relevant rules are already part of their working context, even when the prompt only references a task area indirectly.
- If a prompt contains an `add rule` statement, update this file immediately in the matching section before considering the task complete.
- If a prompt contains an optimization request, update the relevant rules when the project guidance should change, not only the implementation.
- When a task changes project structure, architectural boundaries, or recurring file-placement expectations, update the relevant rules in this file in the same task.
- When a rule changes project workflow or contributor expectations, reflect that change in `README.md` and adjust `docs/WORKFLOW.md` if contributor workflow guidance should change too.
- Keep AI-specific instruction entrypoints such as `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` aligned with this file when shared prompt behavior changes.
- Use `docs/PROJECT_REVIEW.md` and `docs/WORKFLOW.md` as inputs when refining recurring project rules, but keep this file as the canonical rules source.
- Keep supporting markdown files compact. Prefer short references back to this file instead of repeating long rule lists across multiple docs.

## General

- Use `pnpm` for project commands. Do not switch examples or contributor guidance to `npm`.
- Keep TypeScript strictness, ESLint, Prettier, tests, and Husky hooks working. New changes should not weaken existing quality gates.
- Prefer the smallest correct change that fits the existing structure.
- Apply the DRY principle. When logic, UI structure, or configuration patterns repeat, prefer extracting or extending an existing shared helper, component, or module instead of copying the pattern again.
- When a requested JavaScript or TypeScript syntax preference can be enforced mechanically, prefer enabling or adjusting the corresponding ESLint rule instead of relying only on contributor discipline.
- When a requested JavaScript or TypeScript syntax preference also depends on formatting behavior, update the relevant Prettier configuration when that style can be enforced there as well.
- When a requested CSS or SCSS syntax preference can be enforced mechanically, prefer enabling or adjusting the corresponding Stylelint rule instead of relying only on contributor discipline.
- When a requested commit message format changes, update the Commitlint configuration in the same task when the repository can enforce that convention automatically.
- Preserve existing behavior unless the task explicitly changes behavior.
- Favor existing project patterns over introducing new abstractions, state layers, or architectural styles without a clear need.
- Keep documentation grounded in the current shipped behavior and known constraints, not aspirational plans.
- When generating or naming world content such as places, factions, enemies, items, events, structures, or flavor text, align it with the established lore in `docs/lore/REALMFALL.md`.
- In JavaScript and TypeScript, when a function immediately returns an expression, prefer concise arrow functions without a block body.
- Keep ESLint syntax rules aligned with the current JavaScript and TypeScript style expectations so these conventions are auto-checked and auto-fixable when practical.

## Architecture

- Keep gameplay and simulation rules in `src/game` so they stay testable and mostly UI-independent.
- Keep React app orchestration in `src/app` and presentational UI in `src/ui/components`.
- Keep Pixi world rendering concerns in `src/ui/world` rather than mixing them into gameplay rules.
- Avoid adding more responsibilities to already large orchestration modules such as `src/app/App/App.tsx` and broad domain aggregators such as `src/game/state.ts`; prefer extracting focused hooks, helpers, or domain modules.
- Keep configurable balancing and world values in `game.config.json` or dedicated config modules instead of scattering magic numbers through UI code.
- Give every unique item its own configuration file for its gameplay and presentation data, including icon, drop chance, and similar item-specific values.
- Give every unique enemy its own configuration file for its gameplay and presentation data, including icon, appearance chance, and similar enemy-specific values.
- Give every unique structure its own configuration file for its gameplay and presentation data, including icon, provided functions, and similar structure-specific values.
- Prefer extending existing helpers, caches, and domain modules before adding parallel systems that solve the same problem differently.

## Persistence

- Preserve the normalize-before-hydrate pattern for save compatibility. If persisted data shape changes, update normalization instead of assuming fresh saves.
- Treat `src/persistence/storage.ts` and similar local save protection as obfuscation, not real security. Do not describe client-side passphrase-based storage as secure encryption or meaningful secret protection.
- Keep persistence concerns isolated from core game rules when possible.
- Prefer debounced or meaningfully-triggered autosave work over repeated full serialization and storage writes on every eligible change.
- Track gameplay persistence dirtiness separately from UI layout, window-visibility, and filter persistence dirtiness when that keeps narrow UI-only changes from rebuilding full gameplay snapshots.
- If gameplay and UI persistence still share one stored payload, keep their serialization, dirty detection, or snapshot assembly paths narrow enough that UI-only changes do not force avoidable gameplay snapshot rebuilds.
- Avoid rewriting identical save payloads when no persisted state meaningfully changed.

## React UI

- Follow the existing window-based desktop-style UI instead of introducing unrelated navigation patterns.
- Keep heavy app coordination in dedicated hooks when possible, following patterns already used in `src/app/App`.
- When reducing React rerender fanout, move window-specific derivation, dock composition, and stable window handler ownership out of `src/app/App/App.tsx` and into narrower hooks or the window composition layer when that keeps unrelated windows from recomputing together.
- Keep Storybook stories for every component under `src/ui/components`, including shared leaf components and window wrappers.
- Every component addition, removal, or behavior-affecting UI change should add or update the corresponding Storybook story in the same task.
- Keep aggregate Storybook catalogs for entity dictionaries such as `ITEM_CONFIGS`, `ENEMY_CONFIGS`, and `STRUCTURE_CONFIGS`, and prefer rendering those catalogs directly from the live config arrays so entity additions, removals, and edits appear automatically.
- Prefer maximally reusable UI components and helpers. When multiple windows or controls share the same structure or behavior, reuse or extend a shared primitive instead of maintaining parallel implementations.
- Keep user-facing UI copy in i18n resources instead of inline string literals in components, gameplay modules, or content definitions.
- Default to `en` and keep locale resources lazy-loadable so additional languages can stay off the initial path when they are not needed.
- When new user-facing text is required, add a new i18n key instead of hardcoding a fallback string in code.
- Use dot-separated i18n keys in the form `{feature}.{area}.{property}` and extend with deeper segments only when needed for clarity.
- For label formatters that map stable identifiers such as status effects to i18n, prefer direct patterned key lookups over conditional `if` or `switch` chains when the key can be derived safely.
- Lazy-load secondary UI only when it matches the existing usage pattern and helps keep the initial app path lighter.
- Treat draggable window content as secondary UI by default. New windows should defer their content behind a lazy-loaded bundle, either by lazy-loading the whole window module or by lazy-loading a dedicated `*WindowContent` module inside the window component.
- Preserve existing React containment patterns such as memoized window components when extending the current UI.
- Maintain mobile-aware and desktop-safe behavior when changing interactions, even if the full mobile adaptation is still incomplete.
- Keep high-frequency pointer, hover, and world-interaction updates off broad React state paths when refs, invalidation flags, or narrower state can avoid avoidable rerenders.
- Deduplicate `pointermove` world-hover work by hovered hex before doing heavier interaction logic, and avoid rerunning tooltip derivation, enemy lookups, or pathfinding while the pointer stays on the same tile.
- On the world-hover path, only run pathfinding, enemy tooltip derivation, or similar heavier selectors when the hovered tile is actually actionable.
- For follow-cursor world tooltips, reuse the existing world-hover pipeline to push position updates instead of adding a separate global pointer listener just to move the tooltip DOM.
- Keep component modules compatible with React Fast Refresh expectations; move shared non-component exports out of component files when needed.
- Keep shared window labels, hotkey metadata, and similar reusable UI constants in plain non-component modules so component files only export component concerns.
- Window title bars should reuse shared controls wherever possible. Close actions must use the shared close button implementation and surface the shared custom tooltip consistently across every window.
- For ability, buff, and debuff icons rendered through CSS masks, use transparent SVG assets with no full-canvas background shape. If sourcing icons externally, prefer transparent exports or strip the background path before committing so the UI does not render a solid square.
- For UI elements that already use the custom game tooltip system, do not add native browser `title` tooltips. Buffs, debuffs, abilities, and similar interactive affordances should use the shared custom tooltip consistently so browser-default tooltips never compete with or duplicate the in-game tooltip.

## Pixi And Performance

- Protect frame rate on the world map path. Avoid unnecessary rerenders, reallocation-heavy render steps, and asset churn in Pixi code.
- Prefer extending existing render helpers, caches, math utilities, and pools in `src/ui/world` over duplicating render logic.
- Preserve and extend the existing pooling and persistent-stage-layer approach before introducing new world-render allocation paths.
- Smooth visual transitions are preferred for color and position changes when they are part of visible world feedback.
- Consider React rerender cost and Pixi redraw cost together for world-facing changes.
- Prefer a single clear render scheduler for the world path. Avoid duplicate immediate redraw triggers layered on top of the ticker unless there is a measured reason.
- When React-driven world state changes need a redraw, prefer updating refs or lightweight invalidation flags that the ticker consumes instead of adding a second immediate `renderScene` effect path.
- Key static and interaction Pixi redraw invalidation off stable world-render inputs or explicit render-version tokens instead of whole `GameState` identity when broad state cloning would otherwise thrash cached layers.
- Reuse `visibleTiles` arrays and other world-facing selector outputs across unrelated state clones when the visible tile set and relevant world data did not change, so Pixi invalidation can key off stable inputs instead of broad app state identity.
- Cache deterministic per-tile or per-scene render inputs instead of recomputing stable randomness and presentation values every frame.
- Separate static world layers from animated or transient layers when doing so reduces repeated redraw cost without making the renderer harder to reason about.
- Keep world-map terrain geometry, fog, ground cover, and stable structure or enemy markers on cached static Pixi layers. Do not redraw unchanged map geometry on every ticker frame just because time-based animation is advancing.
- Put hover, selection, and other short-lived interaction highlights on their own invalidated layer so pointer-state changes do not force a rebuild of the full world scene.
- Reserve per-frame ticker redraws for genuinely animated layers such as clouds, atmosphere, overlays, firelight, and similar time-driven effects; static layers should refresh only when their actual inputs change.
- Use device-aware quality budgets for Pixi rendering. Cap expensive defaults such as full-resolution rendering or unconditional antialiasing when they threaten frame time on weaker or high-DPI devices.
- Keep lightweight performance budgets documented and visible. Treat roughly `16.7 ms` as the default desktop frame-time budget for normal world interaction, and investigate changes that push the initial startup chunks materially beyond the current envelope of about `235 kB` for the main app chunk, `145 kB` for `react-vendor`, and `435 kB` for `pixi` before gzip.
- Prefer small, focused render tests for world math, lighting, filters, caches, and deterministic presentation behavior when changing Pixi logic.
- Do not flag Pixi startup antialiasing or full-DPR defaults as standalone review issues during general best-practice reviews unless the task explicitly targets renderer quality settings or there is measured evidence that those defaults are causing device-specific regressions.

## Build And Bundle

- Keep the production bundle intentional. Avoid pushing heavy world-only or secondary UI code onto the initial path when existing lazy-loading or chunking patterns can keep it deferred.
- When adding a new draggable window, preserve bundle splitting for its content instead of inlining that content into the initial app path.
- Prefer targeted code splitting for heavier dependencies instead of collapsing all third-party code into one growing vendor chunk.
- Treat bundle growth as a real performance cost, especially on the initial app path and in Pixi-heavy features.
- Document small bundle-size expectations in contributor-facing guidance so chunk regressions are easier to spot before they become large enough to require emergency refactors.
- Keep the automated startup chunk budget check aligned with the current envelope. `pnpm build:budget` should enforce the live `index`, `react-vendor`, and `pixi` thresholds used in local verification and CI.

## Testing

- Add or update tests for non-trivial gameplay, rendering math, persistence normalization, and bug-fix changes when practical.
- Every issue fix should be followed by adding or adjusting tests that cover the fixed behavior, unless the repository cannot reasonably test that path yet. In that case, document the gap explicitly.
- When a fix changes expected behavior, also update the corresponding spec requirement in the same task when the repository already documents that area.
- Favor deterministic tests for game-state changes and rendering calculations.
- Keep production buildability in mind, not only local dev behavior.
- When performance-sensitive behavior changes, verify both correctness and the likely rerender or redraw impact.
- When optimization work changes React, Pixi, hover handling, or bundle shape, document a concrete verification path for rerender breadth, redraw breadth, hover hot paths, and startup chunk growth instead of leaving performance validation implicit.
- Keep a coverage test for Storybook parity so component additions or removals in `src/ui/components` fail fast when corresponding stories are missing.

## Documentation

- Keep `README.md` accurate about the current game state, package manager, save behavior, quality commands, and contributor workflow.
- Keep `docs/WORKFLOW.md` aligned with the actual contributor workflow, recurring review expectations, and commit conventions.
- Prefer documenting real project constraints and current behavior over aspirational wording.
- When prompts establish recurring workflow expectations, capture them here so future prompt handling stays consistent.
- Keep rule and workflow updates synchronized across `README.md`, `docs/WORKFLOW.md`, and the AI-specific instruction files when those updates affect future prompt execution.
- Keep lore-sensitive guidance aligned with the canonical world reference in `docs/lore/REALMFALL.md`.
- Keep current-system specs under `docs/specs` for implemented gameplay features and technical solutions.
- Every implemented feature should be followed by creating or updating the relevant spec in `docs/specs` before the task is considered complete.
- When changing an existing feature, update the matching spec in the same task so the spec stays aligned with shipped behavior.
- Every fix should update the corresponding spec in the same task when that fix adds, removes, or clarifies a documented requirement.
- Each gameplay feature and each technical solution should have its own dedicated spec file. Do not merge multiple implemented features or multiple technical solutions into one general reference spec.
- Use index documents only as navigation over dedicated spec files, not as replacements for them.

## Current Project Constraints

- The game does not support mods.
