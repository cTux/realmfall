import { describe, expect, it } from 'vitest';
import { pickStructureType } from './index';

describe('pickStructureType', () => {
  it('uses the reduced base resource spawn bands across terrains', () => {
    expect(pickStructureType(0, 0.861, 'forest')).toBe('tree');
    expect(pickStructureType(0, 0.83, 'forest')).toBe('iron-ore');
    expect(pickStructureType(0, 0.819, 'forest')).toBeUndefined();

    expect(pickStructureType(0, 0.841, 'plains')).toBe('copper-ore');
    expect(pickStructureType(0, 0.8, 'plains')).toBe('lake');
    expect(pickStructureType(0, 0.789, 'plains')).toBeUndefined();

    expect(pickStructureType(0, 0.821, 'swamp')).toBe('iron-ore');
    expect(pickStructureType(0, 0.811, 'swamp')).toBe('pond');
    expect(pickStructureType(0, 0.809, 'swamp')).toBeUndefined();

    expect(pickStructureType(0, 0.841, 'desert')).toBe('copper-ore');
    expect(pickStructureType(0, 0.82, 'desert')).toBe('coal-ore');
    expect(pickStructureType(0, 0.809, 'desert')).toBeUndefined();
  });
});
