import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createDefaultActionBarSlots } from '../../../app/App/actionBar';
import { GameTag } from '../../../game/content/tags';
import type { Item } from '../../../game/stateTypes';
import { useActionBarItems } from './useActionBarItems';

type ActionBarItems = ReturnType<typeof useActionBarItems>;

describe('useActionBarItems', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('keeps consumable and slot derivation stable across unrelated rerenders', async () => {
    const trailRation: Item = {
      id: 'trail-ration-1',
      itemKey: 'trail-ration',
      name: 'Trail Ration',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 12,
      thirst: 0,
      tags: [GameTag.ItemConsumable, GameTag.ItemStackable],
    };
    const inventory = [trailRation];
    const slots = createDefaultActionBarSlots();
    slots[0] = { item: trailRation };
    const observedItems: ActionBarItems[] = [];

    function Harness({ tick }: { tick: number }) {
      void tick;
      observedItems.push(useActionBarItems(inventory, slots));
      return null;
    }

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<Harness tick={0} />);
    });
    await act(async () => {
      root.render(<Harness tick={1} />);
    });

    expect(observedItems[1]).toBe(observedItems[0]);
    expect(observedItems[1]?.consumables).toBe(observedItems[0]?.consumables);
    expect(observedItems[1]?.slotItems).toBe(observedItems[0]?.slotItems);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
