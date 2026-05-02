# Queued Travel Window Suppression

This note captures the approved transient design for suppressing automatic
window opening while the player is auto-continuing through a queued far-target
movement path.

## Goal

Keep intermediate queued-travel hexes as transit only. While the player is
moving toward a farther resolved destination, no windows should auto-open from
intermediate hex type, structure, loot, or other non-combat tile state. The
only exception is an ambush: if combat starts on an intermediate queued step,
the queued path clears and the combat window opens.

## Approved Decisions

- Suppression applies only to multi-step queued travel.
- Single adjacent movement keeps the current auto-open behavior.
- Intermediate queued steps must not auto-open `hexInfo`.
- Intermediate queued steps must not auto-open the recipe book from crafting
  structures.
- Intermediate queued steps must not auto-open or auto-mount the loot window.
- Manual window actions are unaffected. The suppression applies only to
  automatic opening.
- Ambush is the only exception:
  - the queued path clears immediately
  - the combat window opens
- Final-destination auto-open is allowed only when the player actually reaches
  the current queued destination and no combat starts on that arrival.
- On that true final arrival, the existing destination-driven auto-open paths
  may resume normally, including `hexInfo`, recipe-book promotion, and
  loot-window mounting when the arrived tile qualifies.

## Architecture

- Extend the app-side movement session controller with a small queued-travel
  read model that can answer:
  - whether queued-travel auto-open suppression is active
  - what the current queued destination is
  - whether the most recent approved step was transit or final arrival
- Keep this state in the app movement session, not in `GameState`, because it
  is client session or transport behavior rather than deterministic world state.
- Feed that suppression signal into every current auto-open path rather than
  patching each behavior independently.

## Behavior And Data Flow

- When the player queues a far-target path, the movement controller records the
  final destination and marks queued-travel auto-open suppression active.
- After each approved intermediate step with remaining queued travel:
  - suppress `hexInfo` auto-open
  - suppress recipe-book auto-promotion
  - suppress loot-window auto-mounting
- If the player clicks a different far target during cooldown, the controller
  replaces the remaining queue and updates the tracked final destination.
  Suppression remains active and follows the new path.
- When the last queued step is approved and no combat starts, suppression clears
  before React window-promotion effects process the arrived tile. That allows
  the final destination to auto-open its relevant window normally.
- If combat starts on any queued step, the controller clears the remaining queue
  before the next retry can schedule and allows combat attention to open the
  combat window.

## Failure Handling

- If queued travel ends for any reason other than arriving at the current final
  queued destination, suppression clears without replaying missed auto-opens.
- Destination replacement must not allow the old destination to open a window
  later.
- Stale async responses or delayed effects from replaced or invalidated transit
  steps must not reopen suppressed windows.
- An external reposition or invalid next step clears queued travel and
  suppression together.

## Validation Direction

- Add app-level coverage proving intermediate queued steps through structure and
  loot hexes do not auto-open windows.
- Add app-level coverage proving the final queued destination can auto-open its
  relevant window when reached without combat.
- Add coverage proving an ambush during queued travel clears the queue and opens
  combat.
- Add coverage proving replacing the destination during cooldown prevents the
  old destination from auto-opening and preserves the new destination behavior.
- Add coverage proving adjacent one-step movement keeps the existing auto-open
  behavior.

## Likely Touch Points

- `packages/client/src/app/App/world/movement/worldMovementController.ts`
- `packages/client/src/app/App/world/movement/createAppWorldMovementController.ts`
- `packages/client/src/app/App/hooks/useHexInfoWindowPromotion.ts`
- `packages/client/src/app/App/hooks/useCraftingRecipeBookPromotion.ts`
- `packages/client/src/app/App/useWindowTransitions.ts`
- `packages/client/src/app/App/hooks/useCombatAttentionWindow.ts`
- `packages/client/src/app/App/hooks/useAppRuntime.ts`
- `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx`

## Canonical References

- `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
- `docs/specs/reference/gameplay-features/world-exploration/spec.md`
- `docs/rules/30-react-ui.md`
- `docs/rules/60-testing.md`
- `docs/rules/61-documentation.md`
