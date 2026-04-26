import { FIRE_ABILITY_DEFINITIONS } from './fire';
import { ICE_ABILITY_DEFINITIONS } from './ice';
import { LIGHTNING_ABILITY_DEFINITIONS } from './lightning';
import { MELEE_ABILITY_DEFINITIONS } from './melee';
import { SUPPORT_ABILITY_DEFINITIONS } from './support';
import type { AbilityId, AbilityRuntimeDefinition } from '../../types';

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
