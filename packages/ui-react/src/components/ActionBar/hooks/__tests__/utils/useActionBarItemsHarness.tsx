import type { ActionBarSlots } from '../../../../../game/actionBar';
import type { ItemView } from '../../../../../game/stateTypes';
import { useActionBarItems } from '../../useActionBarItems';

export function createUseActionBarItemsHarness(
  inventory: ItemView[],
  slots: ActionBarSlots,
  observedItems: ReturnType<typeof useActionBarItems>[],
) {
  return function UseActionBarItemsHarness({ tick }: { tick: number }) {
    void tick;
    observedItems.push(useActionBarItems(inventory, slots));
    return null;
  };
}
