import { vi, expect } from 'vitest';
import { mountUi } from '../../../uiTestHelpers';
import { t } from '../../../../i18n';
import { stripBracketHotkeyLabel } from '../../../hotkeyLabels';
import { HexInfoWindow } from '../HexInfoWindow';
import type { HexInfoWindowProps } from '../types';
import { buildHexInfoWindowProps } from './utils/hexInfoWindowFixtures';

export class HexInfoWindowTestkit {
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  readonly mock = {
    onSetHome: vi.fn(),
    onInteract: vi.fn(),
    onProspect: vi.fn(),
    onSellAll: vi.fn(),
    onTerritoryAction: vi.fn(),
    onHealTerritoryNpc: vi.fn(),
    onBuyItem: vi.fn(),
    onTakeAll: vi.fn(),
    onTakeItem: vi.fn(),
    onForfeitCombat: vi.fn(),
    onHoverItem: vi.fn(),
    onLeaveItem: vi.fn(),
  };

  readonly actions = {
    mount: async (overrides: Partial<HexInfoWindowProps> = {}) => {
      await this.mount(
        buildHexInfoWindowProps({
          onSetHome: this.mock.onSetHome,
          onInteract: this.mock.onInteract,
          onProspect: this.mock.onProspect,
          onSellAll: this.mock.onSellAll,
          onTerritoryAction: this.mock.onTerritoryAction,
          onHealTerritoryNpc: this.mock.onHealTerritoryNpc,
          onBuyItem: this.mock.onBuyItem,
          onTakeAll: this.mock.onTakeAll,
          onTakeItem: this.mock.onTakeItem,
          onForfeitCombat: this.mock.onForfeitCombat,
          onHoverItem: this.mock.onHoverItem,
          onLeaveItem: this.mock.onLeaveItem,
          ...overrides,
        }),
      );
    },
  };

  readonly expect = {
    closeAndHomeButtonsMatchSize: async () => {
      const closeButton = this.findButtonByAriaLabel(
        'Close',
      ) as HTMLButtonElement | null;
      const homeButton = this.findButtonByText(
        stripBracketHotkeyLabel(t('ui.hexInfo.setHomeAction')),
      );

      expect(closeButton).not.toBeNull();
      expect(homeButton).not.toBeUndefined();

      const closeButtonStyle = getComputedStyle(
        closeButton as HTMLButtonElement,
      );
      const homeButtonStyle = getComputedStyle(homeButton as HTMLButtonElement);

      expect(closeButtonStyle.height).toBe(homeButtonStyle.height);
      expect(closeButtonStyle.paddingTop).toBe(homeButtonStyle.paddingTop);
      expect(closeButtonStyle.paddingBottom).toBe(
        homeButtonStyle.paddingBottom,
      );
      expect(closeButtonStyle.minHeight).toBe(homeButtonStyle.minHeight);
    },
    combatForfeitButtonVisible: async () => {
      const forfeitButton = this.findButtonByText(
        stripBracketHotkeyLabel(t('ui.combat.forfeitAction')),
      );

      expect(forfeitButton).toBeDefined();
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

  private async mount(props: HexInfoWindowProps) {
    await this.restore();
    this.mountedUi = await mountUi(<HexInfoWindow {...props} />);
  }

  private findButtonByAriaLabel(label: string) {
    return this.host.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`,
    );
  }

  private findButtonByText(text: string) {
    return Array.from(
      this.host.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent === text);
  }

  private get host() {
    if (!this.mountedUi) {
      throw new Error('Expected mounted HexInfoWindow.');
    }
    return this.mountedUi.host;
  }
}
