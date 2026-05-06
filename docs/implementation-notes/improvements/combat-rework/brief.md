# Combat Rework

This note captures the approved transient design for reworking enemy engagement,
combat start timing, world-map combat feedback, and movement-cooldown
presentation.

## Goal

Make enemy-hex interaction feel direct and consistent by starting combat
immediately on encounter creation, preventing pre-combat movement onto hostile
hexes, preserving the clicked enemy destination for post-victory movement, and
surfacing live combat feedback on the world map through badge updates, floating
combat text, and ring-based cooldown arcs.

## Approved Decisions

- Combat auto-starts immediately for every encounter source.
- The manual `Start Combat` action is removed from the UI.
- The `Q` shortcut for starting combat is removed.
- The gameplay settings toggle for auto-start combat is removed.
- Clicking an adjacent hostile hex does not move the player before combat.
- Clicking an adjacent hostile hex does not spend movement cooldown before
  combat.
- Winning an adjacent-click encounter auto-steps the player onto the hostile
  hex and starts the normal movement cooldown.
- Clicking a distant hostile hex routes the player to the nearest reachable
  adjacent staging hex instead of the hostile destination hex.
- The original hostile destination hex is preserved through combat as the
  post-victory auto-step target for distant hostile clicks.
- Winning a distant-click encounter auto-steps the player from the staging hex
  onto the original hostile destination hex and starts the normal movement
  cooldown.
- Dungeon enemy chase encounters follow the same immediate-start combat rules.
- World-map combat feedback appears only above world badge positions on hexes,
  not inside the combat window.
- Floating damage numbers are red.
- Floating critical damage numbers are orange, slightly larger, and end with
  `!`.
- Floating healing numbers are green, including healing from consumables.
- HP and MP badge rings update live during combat for the player and engaged
  enemy markers.
- The movement cooldown indicator is redesigned as an outer ring arc aligned
  with the MP arc language.
- The redesigned outer cooldown arc applies to the player and to roaming
  dungeon enemy cooldown badges.

## Architecture

- Extend combat encounter metadata in gameplay state so encounter ownership
  stays in `packages/client/src/game` rather than moving post-victory intent
  into app-only refs.
- Keep encounter setup and public combat entrypoints in
  `packages/client/src/game/stateCombat.ts`, while moving any detailed
  engagement metadata helpers into focused neighboring combat modules if the
  state shape grows.
- Keep staging-path selection and hostile-target click classification in
  `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`.
- Keep pathfinding rules in `packages/client/src/game/statePathfinding.ts`, but
  add a focused helper or extension that can resolve a nearest reachable
  adjacent staging hex for hostile destinations.
- Keep queued-movement approval and cooldown ownership in
  `packages/client/src/app/App/world/movement/worldMovementController.ts`, with
  the controller stopping at the staging hex and allowing gameplay-owned combat
  state to take over.
- Keep movement execution in
  `packages/client/src/app/App/world/movement/createAppWorldMovementController.ts`
  and `packages/client/src/game/stateMovement.ts`, with post-victory auto-step
  resolved from encounter metadata rather than from a click-only app ref.
- Keep combat completion side effects in focused combat helpers so victory can
  remove enemies, drop loot, and optionally apply the deferred auto-step into
  the hostile target hex in one deterministic gameplay path.
- Keep the visual combat lunge in the Pixi world renderer as a render-only
  offset derived from encounter metadata. It must not mutate gameplay position
  before victory.
- Keep floating combat text in a focused world-render helper under
  `packages/client/src/ui/world/` so `renderScene.ts` remains a thin
  orchestration facade.
- Reuse the existing entity badge system in
  `packages/client/src/ui/world/renderSceneEntityBadge.ts` for live HP and MP
  ring updates and the new outer cooldown ring, rather than introducing a
  parallel marker chrome system.

## Encounter Metadata Shape

Add narrow encounter metadata sufficient to explain how combat started and what
should happen after victory.

- `engageMode`
  - `adjacent-click`
  - `staged-click`
  - `enemy-chase`
  - other future encounter sources can map into the same shape
- `originCoord`
  - the player coord at the moment the encounter was created
- `stagingCoord`
  - the gameplay coord the player occupies during combat
- `targetCoord`
  - the hostile hex associated with the encounter when one exists, otherwise
    `null`
- `autoStepOnVictory`
  - whether victory should move the player onto `targetCoord` and trigger
    movement cooldown

This metadata belongs to the live encounter shape, not to persisted movement UI
state.

## Runtime Flow

### Adjacent Hostile Click

- Classify the clicked hex as hostile before any movement request is queued.
- Create the encounter immediately from the current player coord.
- Set `stagingCoord` to the current player coord.
- Set `targetCoord` to the clicked hostile coord.
- Mark `autoStepOnVictory` true.
- Start combat immediately with no manual start phase and no movement cooldown.
- On victory, if the target hex remains valid to occupy, move the player to the
  hostile hex and start the normal movement cooldown.

### Distant Hostile Click

- Resolve a nearest reachable adjacent staging hex for the hostile destination.
- If no adjacent staging hex is reachable, do not start travel or combat.
- Queue travel only to the staging hex.
- When the player reaches the staging hex, create the encounter immediately.
- Set `stagingCoord` to the reached adjacent hex.
- Set `targetCoord` to the originally clicked hostile hex.
- Mark `autoStepOnVictory` true.
- On victory, if the target hex remains valid to occupy, move the player onto
  the original hostile destination hex and start the normal movement cooldown.

### Dungeon Enemy Chase

- When a roaming dungeon enemy forces an encounter, create combat in the same
  immediate-start model with no manual start phase.
- Preserve the enemy's pre-engagement coord through `targetCoord` when that
  coord is distinct from the player's `stagingCoord`.
- When a distinct `targetCoord` exists, use the same post-victory auto-step
  rule and start the normal movement cooldown after the win.
- When no distinct `targetCoord` exists, keep `autoStepOnVictory` false and
  leave the player on the staging coord after victory.

### Combat Completion

- Victory resolves enemy removal, loot, and encounter teardown before any
  deferred auto-step.
- Defeat, forfeit, or interrupted combat must not apply the post-victory
  auto-step.
- Deferred auto-step must validate passability and occupancy rules before
  moving.
- When deferred auto-step runs, it uses the normal movement cooldown duration.

## Rendering And UI

### Combat Lunge

- When `stagingCoord` and `targetCoord` differ, the player world badge receives
  a small render-only offset toward `targetCoord` during active combat.
- This offset must not alter gameplay coord, pathfinding origin, loot
  ownership, or save shape.
- When combat ends, the lunge offset disappears before any post-victory
  movement transition begins.

### Floating Combat Text

- Floating combat text renders above world badge anchors on the map.
- Text anchors follow the player badge and the engaged hostile marker positions.
- Multiple combat events can overlap in time, so the renderer should support a
  short-lived queue or stack of active text entries rather than one singleton
  label.
- Combat text styling:
  - damage: red
  - critical damage: orange, slightly larger, suffix `!`
  - healing: green
- Combat text sources include:
  - player damage to enemies
  - enemy damage to player
  - healing abilities
  - healing side effects such as lifesteal
  - consumable healing on the player badge

### Live Badge Updates

- The player badge HP and MP rings update live during combat from current
  gameplay values.
- Engaged hostile enemy markers update their HP and MP rings live during
  combat.
- This change affects badge-ring fills only, not hex-outline or tile-frame
  colors.

### Cooldown Arc Redesign

- Replace the current edge-bar cooldown indicator with an outer ring arc that
  matches the MP arc visual language.
- The cooldown arc sits outside the entity circle at a slightly larger radius
  than the MP ring.
- The arc span and orientation stay consistent between the player badge and
  roaming dungeon enemy cooldown badges.

## Settings And Input Surface Changes

- Remove the gameplay settings entry and persisted field for auto-start combat.
- Remove the gameplay automation hook branch that starts combat from settings.
- Remove manual combat-start affordances from the combat window and hex-facing
  surfaces.
- Remove the keyboard shortcut branch and tests that expose manual combat start.
- Preserve non-start combat controls such as combat progression and forfeit.

## Verification Direction

- Add gameplay tests for:
  - adjacent hostile click encounters starting without moving the player first
  - adjacent hostile victory auto-stepping onto the hostile hex and triggering
    movement cooldown
  - distant hostile clicks resolving a reachable adjacent staging hex
  - distant hostile encounters preserving the original hostile target hex
  - invalid staging destinations preventing travel and combat start
  - dungeon chase encounters using immediate-start combat
  - defeat and forfeit paths skipping the deferred auto-step
- Add app and input tests for:
  - hostile click classification in world navigation
  - removal of the auto-start combat settings toggle
  - removal of the manual start combat UI action and shortcut path
- Add render tests for:
  - outer cooldown ring geometry on the player badge
  - matching outer cooldown ring geometry on roaming dungeon enemies
  - live enemy and player badge ring updates during combat
  - floating combat text color, critical suffix, and larger critical text scale
  - combat lunge offset remaining render-only
- Re-run typecheck, lint, targeted node tests, targeted jsdom tests, and strict
  build-budget validation during implementation because the work touches
  gameplay state, click navigation, world rendering, and UI settings.

## Canonical References

- `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`
- `packages/client/src/app/App/world/movement/createAppWorldMovementController.ts`
- `packages/client/src/app/App/world/movement/worldMovementController.ts`
- `packages/client/src/app/App/world/movement/worldMovementTransition.ts`
- `packages/client/src/app/App/hooks/useGameplayAutomation.ts`
- `packages/client/src/app/gameplaySettings.ts`
- `packages/client/src/game/stateMovement.ts`
- `packages/client/src/game/stateCombat.ts`
- `packages/client/src/game/stateCombatRuntime.ts`
- `packages/client/src/game/stateCombatAbilityResolution.ts`
- `packages/client/src/game/stateCombatEnemyDefeat.ts`
- `packages/client/src/game/statePathfinding.ts`
- `packages/client/src/game/stateWorldQueries.ts`
- `packages/client/src/game/types.ts`
- `packages/client/src/ui/world/renderScene.ts`
- `packages/client/src/ui/world/renderSceneAnimated.ts`
- `packages/client/src/ui/world/renderSceneEntityBadge.ts`
- `packages/client/src/ui/world/renderScenePlayerBars.ts`
- `packages/client/src/ui/world/renderSceneStaticMarkers.ts`
- `docs/specs/reference/gameplay-features/combat/spec.md`
- `docs/specs/reference/gameplay-features/dungeons/spec.md`
- `docs/specs/reference/gameplay-features/game-settings/spec.md`
- `docs/specs/reference/gameplay-features/ui-surfaced-gameplay/spec.md`
- `docs/specs/reference/gameplay-features/world-exploration/spec.md`
- `docs/specs/reference/technical-solutions/combat-system-implementation/spec.md`
- `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- `docs/rules/10-architecture.md`
- `docs/rules/30-react-ui.md`
- `docs/rules/40-pixi-performance.md`
- `docs/rules/60-testing.md`
- `docs/rules/61-documentation.md`
