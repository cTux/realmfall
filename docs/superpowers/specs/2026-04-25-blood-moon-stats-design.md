# Blood Moon Stats Design

## Goal

Correct Blood Moon enemy stat scaling so affected enemies are 10% stronger than their non-Blood-Moon base values instead of heavily weakened.

## Decisions

- Blood Moon modifies enemy `maxHp`, `attack`, and `defense`.
- Each affected stat becomes `Math.round(baseStat * 1.1)` with a minimum of `1`.
- Enemy current HP ratio is preserved when `maxHp` changes.
- Enemies created during an active Blood Moon spawn with the boosted values immediately.
- When the Blood Moon ends, enemies return to their stored base stats and keep the same current HP ratio.

## Scope

- Update gameplay code in `src/game/combat.ts`.
- Update Blood Moon scaling config in `src/game/config.ts`.
- Update deterministic gameplay tests in `src/game/stateWorldEvents.test.ts`.
- Update the gameplay reference spec in `docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md`.
