# Progression

## Scope

This spec covers player leveling, mastery, and skill progression.

## Current Behavior

- The player gains XP from gameplay outcomes such as combat.
- Level ups resync player base survivability and combat stats to anchored balance values instead of applying a flat per-level increment.
- Player base stats scale from `150 / 50 / 35` at level `1` to `4000 / 800 / 200` at level `100`.
- Level ups do not refill HP or mana; current resource values carry forward while only the maximums and base combat stats increase.
- Ordinary player levels cap at `100`.
- After the normal cap, XP advances mastery levels instead of ordinary levels.
- Current skills are gathering, logging, mining, skinning, fishing, cooking, smelting, and crafting.
- Skill XP is awarded by related actions.
- Higher skill levels improve gathering yield bonus and bonus proc chance where applicable.
- The skills window uses the shared resizable window shell and scrolls its skill list inside the window body when the content outgrows the current size.
- The skills window lists skill names with progress bars, inline `level/current/max XP` text, and tooltips, rounds bar values for display so floating-point residue does not leak into the UI, and does not render the old explanatory note above the skill list.
- Skill rows in the skills window keep a stable intrinsic height instead of stretching vertically to fill extra window space.

## Main Implementation Areas

- `src/game/progression.ts`
- `src/game/state.ts`
- `src/ui/components/SkillsWindow/SkillsWindowContent.tsx`
