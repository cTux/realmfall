import { useMemo } from 'react';
import { describeStructure, type Tile } from '../../../game/state';

export function useRecipeWindowStructure(structure: Tile['structure']) {
  return useMemo(() => describeStructure(structure), [structure]);
}
