import { describe, expect, it } from 'vitest';
import {
  getItemModificationKindForStructure,
  getItemModificationStructureHint,
} from './itemModifications';

describe('item modification structures', () => {
  it('reads modification kind and hint text from structure config metadata', () => {
    expect(getItemModificationKindForStructure('rune-forge')).toBe('reforge');
    expect(getItemModificationKindForStructure('mana-font')).toBe('enchant');
    expect(getItemModificationKindForStructure('corruption-altar')).toBe(
      'corrupt',
    );
    expect(getItemModificationKindForStructure('tree')).toBeNull();

    expect(getItemModificationStructureHint('rune-forge')).toContain(
      'reforge one secondary stat',
    );
    expect(getItemModificationStructureHint('mana-font')).toContain(
      'cyan enchanted stat',
    );
    expect(getItemModificationStructureHint('corruption-altar')).toContain(
      'corrupt it',
    );
    expect(getItemModificationStructureHint('tree')).toBeNull();
  });
});
