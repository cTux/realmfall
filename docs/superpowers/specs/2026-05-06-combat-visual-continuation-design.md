# Combat Visual Continuation Design

## Summary

Refine the recent world-combat rework in two places:

- make the movement cooldown arc touch the MP arc exactly, with no visible gap and no overlap
- make victory auto-step motion continue from the current combat lunge pose into the target hex over the normal full movement-transition duration instead of snapping the player back to hex center first

## Goals

- Keep the player and roaming dungeon-enemy cooldown arcs aligned with the current badge system.
- Make the cooldown arc visually lean on the MP arc by sharing the boundary between the two rings.
- Preserve the current staged-combat intro flow: arrive at staging hex, animate the small forward step, then start combat.
- Preserve the current victory auto-step rule: if the encounter was created with `autoStepOnVictory`, the player ends up on the preserved target hex and movement cooldown activates.
- Remove the visual snap from "lunged during combat" back to "hex center" before the victory auto-step starts.
- Keep the post-victory movement into the target hex using the normal full hex-move visual duration.

## Non-Goals

- Do not change combat timing, damage resolution, or encounter ownership beyond the post-victory visual handoff.
- Do not shorten the auto-step transition to reflect the player already being partway toward the target.
- Do not redesign HP or MP badge geometry beyond the cooldown-ring contact change.
- Do not change the cooldown duration itself for player or dungeon-enemy movement.

## Current Problem

The current world-combat flow holds the player in the forward lunge during combat, but when the fight ends and the auto-step fires, the next movement transition starts from the regular hex center. That creates a visible reset: the player snaps backward to center and then begins the move into the target hex.

The movement cooldown ring also renders with a small gap outside the MP arc. The requested look is tighter: the cooldown ring should touch the MP ring directly so the outer ring feels structurally attached to the inner resource badge.

## Recommended Approach

Keep the existing gameplay state transitions and fix the visual handoff in the world rendering and movement-transition layer.

- For cooldown geometry, adjust the cooldown arc band math so its inner radius begins exactly at the MP arc's outer radius.
- For victory handoff, capture the player's active lunge offset when the encounter tears down and feed that offset into the next world movement transition so the transition starts from the lunged pose rather than the hex center.

This is lower risk than changing auto-step gameplay resolution or reworking combat teardown into a more complex staged state machine.

## Alternatives Considered

### 1. Keep the current auto-step and fake the continuation entirely in combat rendering

This would try to hide the snap by extending combat-only lunge visuals slightly past encounter teardown.

Why not:

- the combat state is removed before the move transition completes
- the movement system already owns the camera and tile-transition motion
- the handoff point belongs in the transition layer, not in lingering combat-only rendering

### 2. Rework auto-step into multiple gameplay sub-steps

This would represent "finish lunge", "move into hex", and "activate cooldown" as separate explicit state transitions.

Why not:

- it broadens a visual correction into gameplay sequencing work
- it increases persistence and testing surface without changing the actual gameplay result
- the current rules already produce the right final state

## Design

### Cooldown Arc Geometry

Current cooldown geometry expands the resource badge arc band with a positive gap, producing a small separation between the blue MP ring and the yellow movement-cooldown ring.

Change that geometry for both:

- player movement cooldown rendering
- roaming dungeon-enemy cooldown badge rendering

The approved visual choice is:

- exact touch
- zero gap
- zero overlap

Implementation-wise, the cooldown band should start from the resource band's outer radius instead of adding a positive gap. Thickness and arc span remain unchanged.

### Victory Auto-Step Visual Handoff

When combat ends and `applyCombatVictoryAutoStep` moves the player onto the target hex, the next world movement transition should start from the player's current rendered lunge position rather than from the source hex center.

The handoff should work like this:

1. During combat, the player remains visually offset toward the preserved target hex.
2. On victory, gameplay state resolves immediately the same way it does now: combat clears, player coordinate becomes the target hex, and movement cooldown is seeded.
3. Before the first post-victory render, the world transition layer captures the outgoing lunge offset from the completed encounter.
4. The new movement transition interpolates from that captured offset into the destination hex center over the normal full world-movement visual duration.

This keeps the gameplay state simple while making the motion read as one uninterrupted push through the enemy tile.

### Source Of Truth

The visual handoff data should come from the combat engagement metadata plus the lunge math that already determines the current forward-step offset.

The world-render path should not invent a second independent notion of where the player "was" during combat. It should derive:

- which direction the lunge faced
- how far along the lunge pose the player was held

from the same combat-engagement inputs already used by `renderSceneCombatFeedback`.

### Transition Ownership

The movement-transition system already owns:

- source and destination coordinates
- transition duration
- camera offset during hex travel

Extend that system with an optional visual source offset for the outgoing pose. For ordinary movement, the value remains zero. For combat victory auto-step, the value is the carried-forward lunge offset.

This keeps the special case localized to transition setup and preserves the thin orchestration role of `renderScene.ts`.

## Data Flow

### Cooldown Arc

1. Entity badge helpers compute the HP and MP arc band as they do now.
2. Cooldown-band math uses the MP arc's outer boundary as its inner boundary.
3. Player and dungeon-enemy cooldown renderers draw the same arcs with the same duration and progress behavior as before.

### Victory Handoff

1. Combat resolves and auto-step updates player gameplay coordinate to the target hex.
2. `usePixiWorld` detects the combat-to-travel handoff, preserving the engagement data long enough to seed the next movement transition.
3. The movement transition is created with:
   - the old source coordinate
   - the target coordinate
   - the normal move duration
   - an outgoing visual offset equal to the held lunge offset
4. World rendering interpolates from that non-zero source offset back onto the normal destination center as the move completes.

## Error Handling And Edge Cases

- If combat ends without `autoStepOnVictory`, no carry-through offset is used.
- If engagement metadata is missing a valid target or staging coordinate, the transition falls back to ordinary center-to-center movement.
- If the player and target coordinates are not adjacent at teardown time, the carry-through offset is ignored and normal transition behavior applies.
- If the renderer misses the handoff window because the combat state was already absent and no preserved transition seed exists, behavior should degrade to the current center-based transition rather than stall movement.

## Testing

Add or update tests for:

- player cooldown arc band touches the MP arc with zero gap
- dungeon enemy cooldown arc band touches the MP arc with zero gap
- victory auto-step preserves continuous motion from the combat lunge into the target hex
- the victory transition keeps the normal full move duration
- non-auto-step or malformed engagements fall back to ordinary transition setup

Prefer focused tests in the existing world-render and app-movement suites instead of broad end-to-end rewrites.

## Likely File Targets

- `packages/client/src/ui/world/renderScenePlayerBars.ts`
- `packages/client/src/ui/world/renderSceneEntityBadge.ts`
- `packages/client/src/app/App/usePixiWorld.ts`
- `packages/client/src/app/App/world/movement/worldMovementTransition.ts`
- `packages/client/src/ui/world/renderSceneCombatFeedback.ts`
- `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`
- `packages/client/src/ui/world/renderSceneCombatFeedback.test.ts`
- any focused movement-transition or player-bar tests that already cover these paths
