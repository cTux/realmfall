import { act, type ReactNode } from 'react';
import * as ButtonModule from '../../Button/Button';
import buttonStyles from '../../Button/styles.module.scss';
import { mountUi, settleUi } from '../../../test/uiTestHelpers';
import { WindowDock, type WindowDockEntry } from '../WindowDock';
import styles from '../styles.module.scss';

export class WindowDockTestkit {
  readonly mock = {
    buttonRenderSpy: vi.spyOn(ButtonModule, 'Button'),
    onToggle: vi.fn(),
  };

  readonly actions = {
    clickInventoryEntry: async () => {
      await act(async () => {
        this.inventoryEntryButton()?.click();
      });
      await settleUi();
    },
    focusInventoryEntry: async () => {
      await act(async () => {
        this.inventoryEntryButton()?.focus();
      });
      await settleUi();
    },
    render: async () => {
      await this.render(
        <WindowDock
          entries={[this.createEntry()]}
          onToggle={this.mock.onToggle}
        />,
      );
    },
  };

  readonly expect = {
    buttonUsesSharedSurface: async () => {
      const [firstButtonProps] = this.mock.buttonRenderSpy.mock.calls[0] ?? [];
      const button = this.inventoryEntryButton();

      expect(this.mock.buttonRenderSpy).toHaveBeenCalledTimes(1);
      expect(firstButtonProps?.unstyled).toBe(true);
      expect(firstButtonProps?.className).toBe(styles.dockButton);
      expect(button?.classList.contains(styles.dockButton)).toBe(true);
      expect(button?.classList.contains(buttonStyles.button)).toBe(false);
    },
    dockAllowsPointerEvents: async () => {
      expect(getComputedStyle(this.dockElement()!).pointerEvents).toBe('auto');
    },
    inventoryToggleForwarded: async () => {
      expect(this.mock.onToggle).toHaveBeenCalledWith('inventory');
    },
    tooltipHidden: async () => {
      expect(this.tooltip()).toBeNull();
    },
    tooltipVisible: async () => {
      expect(this.tooltip()).not.toBeNull();
    },
  };

  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  async restore() {
    if (this.mountedUi) {
      await this.mountedUi.unmount();
      this.mountedUi = null;
    }
    vi.restoreAllMocks();
  }

  private createEntry(): WindowDockEntry {
    return {
      key: 'inventory',
      label: 'Inventory',
      title: {
        prefix: '(',
        hotkey: 'I',
        suffix: ')nventory',
      },
      icon: 'inventory.svg',
      shown: false,
    };
  }

  private dockElement() {
    return this.mountedUi?.host.querySelector('aside') as HTMLElement | null;
  }

  private inventoryEntryButton() {
    return this.mountedUi?.host.querySelector(
      'button',
    ) as HTMLButtonElement | null;
  }

  private async render(node: ReactNode) {
    if (this.mountedUi) {
      await this.mountedUi.render(node);
      return;
    }

    this.mountedUi = await mountUi(node);
  }

  private tooltip() {
    return this.mountedUi?.host.querySelector(`.${styles.tooltip}`) ?? null;
  }
}
