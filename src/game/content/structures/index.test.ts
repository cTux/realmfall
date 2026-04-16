import { describe, expect, it } from 'vitest';
import { getStructureConfig, pickStructureType } from './index';

describe('pickStructureType', () => {
  it('uses the reduced base resource spawn bands across terrains', () => {
    expect(pickStructureType(0.973, 0, 'plains')).toBe('furnace');
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

describe('localized structure config text', () => {
  it('uses locale-backed gathering labels instead of inline fallback wording', () => {
    const herbs = getStructureConfig('herbs');
    const coalOre = getStructureConfig('coal-ore');
    const furnace = getStructureConfig('furnace');

    expect(herbs.title).toBe('Herb Patch');
    expect(herbs.gathering?.actionLabel).toBe('Gather herbs');
    expect(herbs.gathering?.depletedText).toBe(
      'The herb patch is stripped bare.',
    );
    expect(coalOre.gathering?.actionLabel).toBe('Mine coal');
    expect(coalOre.gathering?.depletedText).toBe(
      'The coal vein crumbles into dead rock.',
    );
    expect(furnace.title).toBe('Furnace');
  });
});
