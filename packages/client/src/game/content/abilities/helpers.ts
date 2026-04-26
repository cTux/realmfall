import type { AbilityRuntimeDefinition } from '../../types';

export function attackAbility(
  definition: Omit<AbilityRuntimeDefinition, 'category'>,
): AbilityRuntimeDefinition {
  return {
    ...definition,
    category: 'attacking',
  };
}

export function supportAbility(
  definition: Omit<AbilityRuntimeDefinition, 'category'>,
): AbilityRuntimeDefinition {
  return {
    ...definition,
    category: 'supportive',
  };
}
