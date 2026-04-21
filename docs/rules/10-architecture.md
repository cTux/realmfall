# Architecture Rules

## Architecture

- Keep gameplay and simulation rules in `src/game` so they stay testable and mostly UI-independent.
- Keep React app orchestration in `src/app` and presentational UI in `src/ui/components`.
- Keep Pixi world rendering concerns in `src/ui/world` rather than mixing them into gameplay rules.
- Prefer colocated structure inside a feature or component directory: place single-use hooks in a local `hooks/` directory, single-use selectors in a local `selectors/` directory, single-use utilities in a local `utils/` directory, and tests in a local `tests/` directory.
- Place shared hooks in `src/hooks`, shared selectors in `src/selectors`, and shared utilities in `src/utils` when multiple features depend on the same module.
- When a file grows multiple exports that are not tightly related types or closely related library or entity helpers, decompose it into focused files instead of expanding one broad module.
- Avoid adding more responsibilities to already large orchestration modules such as `src/app/App/App.tsx` and broad domain aggregators such as `src/game/state.ts`; prefer extracting focused hooks, helpers, or domain modules.
- Keep gameplay reward resolution and world-event spawning in focused helpers such as `src/game/stateRewards.ts` and `src/game/stateWorldEvents.ts` instead of extending `src/game/state.ts` with more domain-specific internals.
- Keep configurable balancing and world values in `game.config.json` or dedicated config modules instead of scattering magic numbers through UI code.
- Add all future chance-based gameplay parameters to `game.config.json`, grouped by gameplay area, instead of introducing new chance constants in content files or other modules.
- Give every unique item its own configuration file for its gameplay and presentation data, including icon and non-chance item-specific values.
- Give every unique enemy its own configuration file for its gameplay and presentation data, including icon and non-chance enemy-specific values.
- Give every unique structure its own configuration file for its gameplay and presentation data, including icon, provided functions, and non-chance structure-specific values.
- Vendor gameplay icon assets in the repository and load them from local files. Do not point shipped item, enemy, structure, generated-equipment, or similar runtime icon paths at remote URLs.
- Prefer extending existing helpers, caches, and domain modules before adding parallel systems that solve the same problem differently.
- When runtime validators need gameplay enum or union values, export canonical runtime lists from the owning game module and reuse them instead of recreating literal allowlists in persistence or UI code.
