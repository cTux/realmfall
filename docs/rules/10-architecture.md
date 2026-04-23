# Architecture Rules

## Architecture

- Keep gameplay and simulation rules in `src/game` so they stay testable and mostly UI-independent.
- Keep React app orchestration in `src/app` and presentational UI in `src/ui/components`.
- Keep Pixi world rendering concerns in `src/ui/world` rather than mixing them into gameplay rules.
- Prefer colocated structure inside a feature or component directory: place single-use hooks in a local `hooks/` directory, single-use selectors in a local `selectors/` directory, single-use utilities in a local `utils/` directory, and tests in a local `tests/` directory.
- Place shared hooks in `src/hooks`, shared selectors in `src/selectors`, and shared utilities in `src/utils` when multiple features depend on the same module.
- When a file grows multiple exports that are not tightly related types or closely related library or entity helpers, decompose it into focused files instead of expanding one broad module.
- Avoid adding more responsibilities to already large orchestration modules such as `src/app/App/App.tsx` and broad domain aggregators such as `src/game/state.ts`; prefer extracting focused hooks, helpers, or domain modules.
- Keep `src/app/normalize.ts` as the public save-hydration entrypoint and move gameplay, combat, item, shared-guard, and UI-state normalization internals into focused `src/app/normalize*.ts` helpers instead of regrowing one broad validator module.
- Keep `src/game/state.ts` focused on mutation-oriented gameplay entrypoints. Put read-only game builders in `src/game/stateFactory.ts`, read-only view helpers in `src/game/stateSelectors.ts`, and shared gameplay types or registries in `src/game/stateTypes.ts`.
- Keep movement traversal entrypoints in `src/game/stateMovement.ts` and world-clock transitions in `src/game/stateWorldClock.ts` so `src/game/state.ts` stays a thin public surface instead of regrowing another mixed-responsibility block.
- When UI, renderer, Storybook, or test code only needs builders, selectors, or types, import those narrower `src/game/state*.ts` modules instead of routing through `src/game/state.ts`.
- In `src/app` and `src/ui`, import `src/game/state.ts` only when the code needs mutation-oriented entrypoints that do not yet live in a narrower gameplay module. Route types, selectors, builders, and other read-only helpers through `src/game/stateTypes.ts`, `src/game/stateSelectors.ts`, `src/game/stateFactory.ts`, or the owning focused module.
- Keep gameplay reward resolution and world-event spawning in focused helpers such as `src/game/stateRewards.ts` and `src/game/stateWorldEvents.ts` instead of extending `src/game/state.ts` with more domain-specific internals.
- Keep structure-specific render flags, item-modification capabilities, and gather-behavior taxonomy in `StructureConfig` metadata or canonical structure tags. Do not rebuild parallel structure-name allowlists in renderer, reward, or UI modules.
- Keep inventory sorting, town trade, prospecting, item locking, and tile-loot transfer mutations in focused state helper modules such as `src/game/stateInventoryActions.ts` instead of expanding `src/game/state.ts` with another broad block of item-management flows.
- Keep item activation, equip or unequip flows, consumable use, recipe-page learning, and consumable-cooldown mutation logic in focused helpers such as `src/game/stateItemActions.ts` instead of rebuilding another item-behavior block inside `src/game/state.ts`.
- Keep shared consumable effect descriptors in `src/game/consumables.ts` and have tooltip builders plus item-use mutation flows render from that shared shape instead of maintaining parallel effect tables in gameplay and UI modules.
- Keep home-setting, territory-claim, and gather-structure mutations in focused state helper modules such as `src/game/stateWorldActions.ts` instead of adding another broad world-action block inside `src/game/state.ts`.
- Keep recipe-book selectors and craft-execution mutations in focused state helper modules such as `src/game/stateCrafting.ts` instead of growing another recipe block inside `src/game/state.ts`.
- Keep encounter creation, combat timing, and battle-resolution mutations in focused state helper modules such as `src/game/stateCombat.ts` instead of leaving another large combat block inside `src/game/state.ts`.
- Keep `src/game/stateCombat.ts` as the combat orchestration entrypoint and move combat damage resolution, target selection, status-effect mutation, proc math, and combat-log formatting into neighboring `src/game/combat*.ts` helpers instead of regrowing one broad combat runtime file.
- Keep `src/game/stateCombat.ts` limited to public combat entrypoints and lightweight setup. Place the long-running combat resolution loop and cast-processing internals in focused neighboring runtime helpers instead of expanding the API surface file.
- Keep `src/app/App/App.tsx` centered on top-level hook composition. Move shell markup, auto-open window effects, and other single-purpose orchestration branches into local components or hooks under `src/app/App/components` and `src/app/App/hooks`.
- Keep configurable balancing and world values in `game.config.ts` or dedicated config modules instead of scattering magic numbers through UI code.
- Add all future chance-based gameplay parameters to `game.config.ts`, grouped by gameplay area, and document each parameter inline instead of introducing new chance constants in content files or other modules.
- Give every unique item its own configuration file for its gameplay and presentation data, including icon and non-chance item-specific values.
- Give every unique enemy its own configuration file for its gameplay and presentation data, including icon and non-chance enemy-specific values.
- Give every unique structure its own configuration file for its gameplay and presentation data, including icon, provided functions, and non-chance structure-specific values.
- Vendor gameplay icon assets in the repository and load them from local files. Do not point shipped item, enemy, structure, generated-equipment, or similar runtime icon paths at remote URLs.
- Prefer extending existing helpers, caches, and domain modules before adding parallel systems that solve the same problem differently.
- Remove orphaned content registries when the live pipeline no longer consumes them; do not keep parallel static tables beside the active source-of-truth modules for recipes, items, or similar content.
- When runtime validators need gameplay enum or union values, export canonical runtime lists from the owning game module and reuse them instead of recreating literal allowlists in persistence or UI code.
- Drive repeated app key maps and gameplay-key records from canonical runtime registries. Window visibility defaults, dock ordering, log-filter defaults, and skill-key derivations should reuse shared key lists or helper builders instead of hand-maintaining parallel object literals across app, normalization, and fixture modules.
- Cache shared world-query results off stable container identities such as `tiles` when claim, visibility, or similar scans would otherwise repeat across unrelated UI updates.
