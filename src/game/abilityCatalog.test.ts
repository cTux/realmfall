import { describe, expect, it } from 'vitest';
import {
  ABILITY_RUNTIME_DEFINITIONS,
  DEFAULT_ABILITY_ID,
  getAbilityDefinition,
} from './abilityCatalog';

describe('ability runtime catalog', () => {
  it('keeps the canonical runtime definitions in the dedicated catalog', () => {
    expect(ABILITY_RUNTIME_DEFINITIONS[DEFAULT_ABILITY_ID]?.id).toBe(
      DEFAULT_ABILITY_ID,
    );
    expect(ABILITY_RUNTIME_DEFINITIONS.fireball?.school).toBe('fire');
  });

  it('falls back to Kick for unknown runtime ability ids', () => {
    expect(getAbilityDefinition('not-real' as never).id).toBe(
      DEFAULT_ABILITY_ID,
    );
  });
});
