import { act } from 'react';
import { expect, vi } from 'vitest';
import { t } from '../../../../i18n';
import { buildItemFromConfig } from '../../../../game/content/items';
import { ItemId } from '../../../../game/content/ids';
import { INVENTORY_SORT_MODES } from '../../../../game/inventory';
import { mountUi, settleUi } from '../../../uiTestHelpers';
import type { InventoryWindowProps } from '../types';
import { InventoryWindow } from '../InventoryWindow';

export class InventoryWindowTestkit {
  readonly mock = {
    onSort: vi.fn(),
    onActivateItem: vi.fn(),
    onSellItem: vi.fn(),
    onContextItem: vi.fn(),
    onHoverItem: vi.fn(),
    onLeaveItem: vi.fn(),
  };

  readonly actions = {
    chooseSortMode: async (mode: (typeof INVENTORY_SORT_MODES)[number]) => {
      await this.whenReady();
      await this.dispatchButton(
        Array.from(this.mountedUi?.host.querySelectorAll('button') ?? []).find(
          (candidate) =>
            candidate.textContent?.includes(this.sortLabel(mode as string)),
        ),
      );
    },
    openSortMenu: async () => {
      await this.whenReady();
      await this.dispatchButton(this.sortButton());
    },
  };

  readonly expect = {
    menuDoesNotShow: async (modeLabel: string) => {
      await this.whenReady();
      expect(this.hostText()).not.toContain(modeLabel);
    },
    menuShowsModeLabels: async () => {
      await this.whenReady();
      expect(this.hostText()).toContain('Type');
      expect(this.hostText()).toContain('Rarity');
      expect(this.hostText()).toContain('Tier');
      expect(this.hostText()).toContain('Name');
    },
    noCheckboxVisible: async () => {
      await this.whenReady();
      expect(this.mountedUi?.host.querySelector('input[type="checkbox"]')).toBe(
        null,
      );
    },
    sortButtonVisible: async () => {
      await this.whenReady();
      expect(this.sortButton()).toBeDefined();
    },
    sortModeForwarded: async (mode: string) => {
      await this.whenReady();
      expect(this.mock.onSort).toHaveBeenCalledWith(mode);
    },
  };

  private readonly ready: Promise<void>;
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  constructor(overrides: Partial<InventoryWindowProps> = {}) {
    const props: InventoryWindowProps = {
      position: { x: 40, y: 40 },
      onMove: () => {},
      visible: true,
      inventory: [buildItemFromConfig(ItemId.TownKnife, { id: 'weapon-1' })],
      equipment: {},
      learnedRecipeIds: [],
      onSort: this.mock.onSort,
      onActivateItem: this.mock.onActivateItem,
      onSellItem: this.mock.onSellItem,
      onContextItem: this.mock.onContextItem,
      onHoverItem: this.mock.onHoverItem,
      onLeaveItem: this.mock.onLeaveItem,
      ...overrides,
    };

    this.ready = mountUi(<InventoryWindow {...props} />).then((mountedUi) => {
      this.mountedUi = mountedUi;
    });
  }

  async restore() {
    await this.whenReady();

    if (this.mountedUi) {
      await this.mountedUi.unmount();
      this.mountedUi = null;
    }
  }

  private async dispatchButton(button: HTMLButtonElement | undefined | null) {
    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settleUi();
  }

  private sortButton() {
    return Array.from(
      this.mountedUi?.host.querySelectorAll('button') ?? [],
    ).find((button) =>
      button.textContent?.includes(t('ui.inventory.sortAction')),
    );
  }

  private sortLabel(mode: string) {
    if (mode === 'type') {
      return t('ui.tooltip.type');
    }

    if (mode === 'rarity') {
      return t('ui.tooltip.rarity');
    }

    if (mode === 'tier') {
      return t('ui.inventory.sort.tier');
    }

    return t('ui.inventory.sort.name');
  }

  private hostText() {
    return this.mountedUi?.host.textContent ?? '';
  }

  private async whenReady() {
    await this.ready;
  }
}
