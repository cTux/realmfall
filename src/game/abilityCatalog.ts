import { MELEE_ABILITY_DEFINITIONS } from './abilityCatalogMelee';
import { FIRE_ABILITY_DEFINITIONS } from './abilityCatalogFire';
import { LIGHTNING_ABILITY_DEFINITIONS } from './abilityCatalogLightning';
import { ICE_ABILITY_DEFINITIONS } from './abilityCatalogIce';
import { SUPPORT_ABILITY_DEFINITIONS } from './abilityCatalogSupport';
import type { AbilityRuntimeDefinition, AbilityId } from './types';

export const DEFAULT_ABILITY_ID = 'kick';

export const ABILITY_RUNTIME_DEFINITIONS: Record<
  AbilityId,
  AbilityRuntimeDefinition
> = {
  ...MELEE_ABILITY_DEFINITIONS,
  ...FIRE_ABILITY_DEFINITIONS,
  ...LIGHTNING_ABILITY_DEFINITIONS,
  ...ICE_ABILITY_DEFINITIONS,
  ...SUPPORT_ABILITY_DEFINITIONS,
};

export function getAbilityDefinition(abilityId: AbilityId) {
  return (
    ABILITY_RUNTIME_DEFINITIONS[abilityId] ??
    ABILITY_RUNTIME_DEFINITIONS[DEFAULT_ABILITY_ID]
  );
}
