# Progression

## Scope

This spec covers player leveling, mastery, and skill progression.

## Current Behavior

- The player gains XP from gameplay outcomes such as combat.
- Level ups increase base survivability and combat stats.
- After the normal cap, XP advances mastery levels instead of ordinary levels.
- Current skills are gathering, logging, mining, skinning, fishing, cooking, smelting, and crafting.
- Skill XP is awarded by related actions.
- Higher skill levels improve gathering yield bonus and bonus proc chance where applicable.

## Main Implementation Areas

- `src/game/progression.ts`
- `src/game/state.ts`
- `src/ui/components/SkillsWindow/SkillsWindowContent.tsx`
