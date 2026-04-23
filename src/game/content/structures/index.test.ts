import { describe, expect, it } from 'vitest';
import { GAME_TAGS } from '../tags';
import { getStructureConfig, pickStructureType } from './index';

describe('pickStructureType', () => {
  it('uses the expected global and resource spawn bands across terrains', () => {
    expect(pickStructureType(0.993, 0, 'plains')).toBe('dungeon');
    expect(pickStructureType(0.989, 0, 'plains')).toBe('corruption-altar');
    expect(pickStructureType(0.985, 0, 'plains')).toBe('forge');
    expect(pickStructureType(0.981, 0, 'plains')).toBe('rune-forge');
    expect(pickStructureType(0.977, 0, 'plains')).toBe('town');
    expect(pickStructureType(0.973, 0, 'plains')).toBe('mana-font');
    expect(pickStructureType(0.969, 0, 'plains')).toBe('furnace');
    expect(pickStructureType(0.965, 0, 'plains')).toBe('workshop');
    expect(pickStructureType(0.961, 0, 'plains')).toBe('camp');

    expect(pickStructureType(0, 0.861, 'forest')).toBe('tree');
    expect(pickStructureType(0, 0.846, 'forest')).toBe('tin-ore');
    expect(pickStructureType(0, 0.83, 'forest')).toBe('iron-ore');
    expect(pickStructureType(0, 0.819, 'forest')).toBeUndefined();

    expect(pickStructureType(0, 0.861, 'plains')).toBe('tin-ore');
    expect(pickStructureType(0, 0.841, 'plains')).toBe('copper-ore');
    expect(pickStructureType(0, 0.8, 'plains')).toBe('lake');
    expect(pickStructureType(0, 0.789, 'plains')).toBeUndefined();

    expect(pickStructureType(0, 0.841, 'swamp')).toBe('platinum-ore');
    expect(pickStructureType(0, 0.821, 'swamp')).toBe('iron-ore');
    expect(pickStructureType(0, 0.811, 'swamp')).toBe('pond');
    expect(pickStructureType(0, 0.809, 'swamp')).toBeUndefined();

    expect(pickStructureType(0, 0.856, 'desert')).toBe('gold-ore');
    expect(pickStructureType(0, 0.846, 'desert')).toBe('platinum-ore');
    expect(pickStructureType(0, 0.841, 'desert')).toBe('copper-ore');
    expect(pickStructureType(0, 0.82, 'desert')).toBe('coal-ore');
    expect(pickStructureType(0, 0.809, 'desert')).toBeUndefined();

    expect(pickStructureType(0, 0.861, 'grove')).toBe('tree');
    expect(pickStructureType(0, 0.811, 'marsh')).toBe('pond');
    expect(pickStructureType(0, 0.856, 'dunes')).toBe('gold-ore');
    expect(pickStructureType(0, 0.841, 'highlands')).toBe('copper-ore');
  });

  it('decorates structures with shared tags and item-modification metadata', () => {
    expect(getStructureConfig('tree').tags).toContain(GAME_TAGS.structure.tree);
    expect(getStructureConfig('copper-ore').tags).toContain(
      GAME_TAGS.structure.ore,
    );
    expect(getStructureConfig('rune-forge').itemModification).toEqual({
      kind: 'reforge',
      hintKey: 'ui.hexInfo.structureHint.runeForge',
    });
    expect(getStructureConfig('mana-font').itemModification).toEqual({
      kind: 'enchant',
      hintKey: 'ui.hexInfo.structureHint.manaFont',
    });
    expect(getStructureConfig('corruption-altar').itemModification).toEqual({
      kind: 'corrupt',
      hintKey: 'ui.hexInfo.structureHint.corruptionAltar',
    });
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
    expect(getStructureConfig('tin-ore').title).toBe('Tin Vein');
    expect(getStructureConfig('gold-ore').gathering?.actionLabel).toBe(
      'Mine gold',
    );
    expect(getStructureConfig('platinum-ore').gathering?.depletedText).toBe(
      'The platinum vein goes pale and empty.',
    );
    expect(furnace.title).toBe('Furnace');
    expect(furnace.tint).toBe(0xffffff);
  });
});
