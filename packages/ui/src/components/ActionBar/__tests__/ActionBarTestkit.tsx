import type { ReactNode } from 'react';
import type { ItemView } from '../../../game/stateTypes';
import { GameTag } from '../../../game/content/tags';
import { mountUi } from '../../../test/uiTestHelpers';
import { ActionBar } from '../ActionBar';

export class ActionBarTestkit {
  readonly actions = {
    renderWithPopulatedFirstSlot: async () => {
      const trailRation = this.createTrailRation();

      await this.render(
        <ActionBar
          inventory={[trailRation]}
          slots={[
            { item: trailRation },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ]}
          onAssignSlot={vi.fn()}
          onClearSlot={vi.fn()}
          onHoverItem={vi.fn()}
          onLeaveItem={vi.fn()}
        />,
      );
    },
  };

  readonly expect = {
    firstSlotHasNoCooldownOverlay: async () => {
      const slotButton = this.firstSlotButton();

      expect(slotButton).not.toBeNull();
      expect(slotButton?.className).not.toContain('cooldownActive');
      expect(
        slotButton?.querySelector('[class*="cooldownOverlay"]'),
      ).toBeNull();
    },
  };

  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

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

  private firstSlotButton() {
    return this.mountedUi?.host.querySelector(
      '[aria-label="Action bar slot 1: Trail Ration"]',
    ) as HTMLButtonElement | null;
  }

  private async render(node: ReactNode) {
    if (this.mountedUi) {
      await this.mountedUi.render(node);
      return;
    }

    this.mountedUi = await mountUi(node);
  }
}
