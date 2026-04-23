import { describe, expect, it } from 'vitest';
import { createWindowVisibilityState } from '../../../app/constants';
import { getDockEntries } from '../../../app/App/utils/getDockEntries';
import { createStorybookFixtures } from './storybookHelpers';

describe('createStorybookFixtures', () => {
  it('derives dock entries from the runtime dock builder', () => {
    const storybookWindowShown = createWindowVisibilityState();
    storybookWindowShown.hero = true;
    storybookWindowShown.recipes = true;
    storybookWindowShown.equipment = true;
    storybookWindowShown.log = true;

    expect(createStorybookFixtures().dockEntries).toEqual(
      getDockEntries(storybookWindowShown),
    );
  });
});
