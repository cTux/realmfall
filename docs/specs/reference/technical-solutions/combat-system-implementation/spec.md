# Combat System Implementation

## Scope

This spec covers the internal combat data structures and event-driven enemy stat mutation behavior.

## Current Solution

- Combat uses per-actor state objects that track abilities, cooldowns, effective cooldown adjustments, global cooldown, and optional casting state.
- Combat automation timing derives from combat actor state plus live combat status effects on the player and current enemies, so ticking effects and expirations advance on time even when the next ability cooldown is far away.
- Encounter setup remains on the world-travel path in `state.ts`, while `stateCombat.ts` coordinates combat start and combat-step scheduling through focused neighboring helpers.
- Combat damage and stat calculations live in `src/game/combatDamage.ts`.
- Combat proc rolls live in `src/game/combatProcs.ts`.
- Combat target selection and actor-readiness helpers live in `src/game/combatTargeting.ts`.
- Combat status-effect mutation and ticking helpers live in `src/game/combatStatus.ts`.
- Combat text and rich-text log formatting live in `src/game/combatLogText.ts`.
- Combat runtime automation timing lives in `src/game/stateCombatAutomationTiming.ts`.
- Combat cast-start logic lives in `src/game/stateCombatCasting.ts`.
- Combat player and enemy ability execution lives in `src/game/stateCombatAbilityResolution.ts`.
- Combat encounter enemy synchronization lives in `src/game/stateCombatEncounterSync.ts`.
- Player and enemy combat actor states are persisted and hydrated in the current runtime shape with no backward save-shape migration layer.
- Ability definitions live in a registry keyed by stable ability ids.
- Raw runtime ability definitions and fallback lookup keep `src/game/abilityCatalog.ts` as the public facade, while neighboring modules such as `abilityCatalogMelee.ts`, `abilityCatalogFire.ts`, `abilityCatalogLightning.ts`, `abilityCatalogIce.ts`, and `abilityCatalogSupport.ts` own the literal school-scoped registries. Enemy or equipment loadout selection plus combat-priority sorting live in `src/game/abilityRuntime.ts`.
- The ability registry is split between that slim gameplay runtime catalog and a presentation wrapper that adds localized names, descriptions, and icons only for UI surfaces.
- The current implementation intentionally keeps the runtime surface small, with `kick` as the shipped baseline ability.
- Blood moon stat scaling is applied by synchronizing enemy state against stored base stats rather than permanently overwriting them.
- This lets event state turn on and off without losing the underlying baseline values.

## Main Implementation Areas

- `src/game/combat.ts`
- `src/game/abilityCatalog.ts`
- `src/game/abilityRuntime.ts`
- `src/game/combatDamage.ts`
- `src/game/combatLogText.ts`
- `src/game/combatProcs.ts`
- `src/game/combatStatus.ts`
- `src/game/combatTargeting.ts`
- `src/game/state.ts`
- `src/game/stateCombat.ts`
- `src/game/stateCombatRuntime.ts`
- `src/game/stateCombatAutomationTiming.ts`
- `src/game/stateCombatCasting.ts`
- `src/game/stateCombatAbilityResolution.ts`
- `src/game/stateCombatEncounterSync.ts`
- `src/app/normalize.ts`
