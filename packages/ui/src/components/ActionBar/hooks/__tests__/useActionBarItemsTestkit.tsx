import type { ReactNode } from 'react';
import {
  createDefaultActionBarSlots,
  type ActionBarSlots,
} from '../../../../game/actionBar';
import { GameTag } from '../../../../game/content/tags';
import type { ItemView } from '../../../../game/stateTypes';
import { mountUi } from '../../../../test/uiTestHelpers';
import { useActionBarItems } from '../useActionBarItems';
import { createUseActionBarItemsHarness } from './utils/useActionBarItemsHarness';

export class UseActionBarItemsTestkit {
  readonly actions = {
    renderTick: async (tick: number) => {
      await this.render(<this.Harness tick={tick} />);
    },
  };

  readonly expect = {
    derivationsStayStableAcrossRerenders: async () => {
      expect(this.observedItems[1]).toBe(this.observedItems[0]);
      expect(this.observedItems[1]?.consumables).toBe(
        this.observedItems[0]?.consumables,
      );
      expect(this.observedItems[1]?.slotItems).toBe(
        this.observedItems[0]?.slotItems,
      );
    },
  };

  private readonly inventory: ItemView[];
  private readonly observedItems: ReturnType<typeof useActionBarItems>[] = [];
  private readonly slots: ActionBarSlots;
  private readonly Harness: ({ tick }: { tick: number }) => null;
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  constructor() {
    const trailRation = this.createTrailRation();
    this.inventory = [trailRation];
    this.slots = createDefaultActionBarSlots();
    this.slots[0] = { item: trailRation };
    this.Harness = createUseActionBarItemsHarness(
      this.inventory,
      this.slots,
      this.observedItems,
    );
  }

  async restore() {
    if (this.mountedUi) {
      await this.mountedUi.unmount();
      this.mountedUi = null;
    }
  }

  private createTrailRation(): ItemView {
    return {
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
  }

  private async render(node: ReactNode) {
    if (this.mountedUi) {
      await this.mountedUi.render(node);
      return;
    }

    this.mountedUi = await mountUi(node);
  }
}
