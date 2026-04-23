# Progression

## Scope

This spec covers player leveling, mastery, and skill progression.

## Current Behavior

- Every enemy awards a fixed base value of `20` XP before bonus modifiers are applied.
- Enemy defeats reduce XP by `20%` per enemy tier below the player tier, capped at `-5` tiers for `0` XP, and increase XP by `10%` per enemy tier above the player tier, capped at `+10` tiers for double XP.
- Player level requirements follow an exponential curve from `20` XP for level `1 -> 2` to `20,000,000` XP for level `99 -> 100`.
- The player gains XP from gameplay outcomes such as combat, and uncapped `Bonus Experience` secondary stats multiply the enemy-tier-adjusted award.
- Level ups resync player base survivability and combat stats to anchored balance values instead of applying a flat per-level increment.
- Player base stats scale from `150 / 50 / 35` at level `1` to `4000 / 800 / 200` at level `100`.
- Level ups do not refill HP or mana; current resource values carry forward while only the maximums and base combat stats increase.
- Ordinary player levels cap at `100`.
- After the normal cap, XP advances mastery levels instead of ordinary levels.
- Mastery starts at `25,000,000` XP for the first mastery level and each additional mastery level requires `5%` more XP than the previous one.
- Current skills are gathering, logging, mining, skinning, fishing, cooking, smelting, and crafting.
- Skill XP is awarded by related actions.
- Higher skill levels improve gathering yield bonus and bonus proc chance where applicable.
- The skills window uses the shared resizable window shell and scrolls its skill list inside the window body when the content outgrows the current size.
- The skills window lists skill names with progress bars, inline `level/current/max XP` text, and tooltips, rounds bar values for display so floating-point residue does not leak into the UI, and does not render the old explanatory note above the skill list.
- Skill rows in the skills window keep a stable intrinsic height instead of stretching vertically to fill extra window space.
- Storybook includes a progression reference story that renders the live XP formulas and full level-requirement tables.

## Main Implementation Areas

- `src/game/progression.ts`
- `src/game/combat.ts`
- `src/game/state.ts`
- `src/ui/components/storybook/ProgressionTables.stories.tsx`
- `src/ui/components/SkillsWindow/SkillsWindowContent.tsx`
