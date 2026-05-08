import { act } from 'react';
import { vi, expect } from 'vitest';
import { mountUi } from '../../../uiTestHelpers';
import {
  HEX_INFO_COMPACT_CONTENT_SLOT_STYLE,
  HEX_INFO_CONTENT_SLOT_STYLE,
} from '../hexInfoSlotStyles';
import { HexInfoWindowContent } from '../HexInfoWindowContent';
import type { HexInfoWindowProps } from '../types';
import { buildHexInfoWindowProps } from './utils/hexInfoWindowFixtures';

export class HexInfoWindowContentTestkit {
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  readonly mock = {
    onInteract: vi.fn(),
    onProspect: vi.fn(),
    onSellAll: vi.fn(),
    onTerritoryAction: vi.fn(),
    onHealTerritoryNpc: vi.fn(),
    onTakeAll: vi.fn(),
    onTakeItem: vi.fn(),
    onHoverItem: vi.fn(),
    onLeaveItem: vi.fn(),
  };

  readonly actions = {
    mount: async (overrides: Partial<HexInfoWindowProps> = {}) => {
      await this.mount(this.contentProps(overrides));
    },
    clickAction: async (label: string) => {
      const target = this.findButton(label);
      expect(target).not.toBeNull();
      await act(async () => {
        target?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    },
  };

  readonly expect = {
    descriptionVisible: async (description: string) => {
      expect(this.host.textContent).toContain(description);
    },
    actionButtonVisible: async (label: string) => {
      expect(this.findButton(label)).toBeDefined();
    },
    interactActionTriggered: async (times: number = 1) => {
      expect(this.mock.onInteract).toHaveBeenCalledTimes(times);
    },
    compactAndWideSlotsRendered: async () => {
      const slotButtons = Array.from(
        this.host.querySelectorAll<HTMLButtonElement>('button[data-size]'),
      );

      expect(slotButtons).toHaveLength(2);
      expect(slotButtons[0]?.getAttribute('style')).toContain(
        '--slot-size: 54.4px',
      );
      expect(slotButtons[0]?.getAttribute('style')).toContain(
        '--slot-icon-size: 1.76rem',
      );
      expect(slotButtons[1]?.getAttribute('style')).toContain(
        '--slot-size: 27.2px',
      );
    },
    slotStyleConstantsStable: async () => {
      expect(HEX_INFO_CONTENT_SLOT_STYLE).toEqual({
        '--slot-size': '54.4px',
        '--slot-icon-size': '1.76rem',
      });
      expect(HEX_INFO_COMPACT_CONTENT_SLOT_STYLE).toEqual({
        '--slot-size': '27.2px',
        '--slot-icon-size': '24.48px',
      });
      expect(Object.isFrozen(HEX_INFO_CONTENT_SLOT_STYLE)).toBe(true);
      expect(Object.isFrozen(HEX_INFO_COMPACT_CONTENT_SLOT_STYLE)).toBe(true);
    },
  };

  constructor() {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  }

  async restore() {
    if (!this.mountedUi) {
      return;
    }

    await this.mountedUi.unmount();
    this.mountedUi = null;
  }

  private async mount(props: Parameters<typeof HexInfoWindowContent>[0]) {
    await this.restore();

    this.mountedUi = await mountUi(<HexInfoWindowContent {...props} />);
  }

  private contentProps(overrides: Partial<HexInfoWindowProps>) {
    const built = buildHexInfoWindowProps({
      onInteract: this.mock.onInteract,
      onProspect: this.mock.onProspect,
      onSellAll: this.mock.onSellAll,
      onTerritoryAction: this.mock.onTerritoryAction,
      onHealTerritoryNpc: this.mock.onHealTerritoryNpc,
      onTakeAll: this.mock.onTakeAll,
      onTakeItem: this.mock.onTakeItem,
      onHoverItem: this.mock.onHoverItem,
      onLeaveItem: this.mock.onLeaveItem,
      ...overrides,
    });

    const {
      position: _position,
      onMove: _onMove,
      visible: _visible,
      onClose: _onClose,
      isHome: _isHome,
      onSetHome: _onSetHome,
      ...contentProps
    } = built;

    return {
      ...contentProps,
      outpostBuildPickerActive: false,
      onTakeAll: this.mock.onTakeAll,
      onTakeItem: this.mock.onTakeItem,
      onHoverItem: this.mock.onHoverItem,
      onLeaveItem: this.mock.onLeaveItem,
    };
  }

  private findButton(label: string) {
    return Array.from(
      this.host.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.includes(label));
  }

  private get host() {
    if (!this.mountedUi) {
      throw new Error('Expected mounted HexInfoWindowContent.');
    }
    return this.mountedUi.host;
  }
}
