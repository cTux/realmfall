import { act } from 'react';
import { expect, vi } from 'vitest';
import labelStyles from '../windowLabels.module.scss';
import { mountUi, settleUi } from '../../uiTestHelpers';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';

export class WindowHeaderActionButtonTestkit {
  readonly actions = {
    click: async () => {
      await this.whenReady();
      await this.dispatchMouseEvent('click', this.button());
    },
    hover: async () => {
      await this.whenReady();
      await this.dispatchMouseEvent('mouseover', this.button());
    },
    unhover: async () => {
      await this.whenReady();
      await this.dispatchMouseEvent('mouseout', this.button());
    },
  };

  readonly expect = {
    contractUsesSmallButton: async () => {
      await this.whenReady();
      expect(this.button()?.getAttribute('data-size')).toBe('small');
      expect(this.button()?.classList.contains('headerButton')).toBe(true);
    },
    hasHotkey: async (hotkey: string) => {
      await this.whenReady();
      expect(
        this.button()?.querySelector(`.${labelStyles.hotkey}`)?.textContent,
      ).toBe(hotkey);
    },
    isDisabled: async () => {
      await this.whenReady();
      expect(this.button()?.getAttribute('aria-disabled')).toBe('true');
    },
    labelShows: async (label: string) => {
      await this.whenReady();
      expect(this.button()?.textContent).toBe(label);
    },
    hoverShowsTooltipFor: async (label: string) => {
      await this.whenReady();
      expect(this.mock.onHoverDetail).toHaveBeenCalledTimes(1);
      expect(this.mock.onHoverDetail.mock.calls[0]?.[1]).toBe(label);
    },
    leaveTooltipTriggered: async () => {
      await this.whenReady();
      expect(this.mock.onLeaveDetail).toHaveBeenCalledTimes(1);
    },
    onClickNotCalled: async () => {
      await this.whenReady();
      expect(this.mock.onClick).not.toHaveBeenCalled();
    },
  };

  private readonly ready: Promise<void>;
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;
  readonly mock = {
    onClick: vi.fn(),
    onHoverDetail: vi.fn(),
    onLeaveDetail: vi.fn(),
  };

  constructor() {
    this.ready = mountUi(
      <WindowHeaderActionButton
        className="headerButton"
        disabled
        tooltipTitle="Cl(a)im"
        tooltipLines={[
          {
            kind: 'text',
            text: 'Claim this hex by spending 1 Cloth and 1 Sticks for a banner.',
          },
        ]}
        onClick={this.mock.onClick}
        onHoverDetail={this.mock.onHoverDetail}
        onLeaveDetail={this.mock.onLeaveDetail}
      >
        Cl(a)im
      </WindowHeaderActionButton>,
    ).then((mountedUi) => {
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

  private async whenReady() {
    await this.ready;
  }

  private button() {
    return this.mountedUi?.host.querySelector(
      'button',
    ) as HTMLButtonElement | null;
  }

  private async dispatchMouseEvent(
    eventType: string,
    target: HTMLButtonElement | null,
  ) {
    const element = target as Element | null;

    await act(async () => {
      element?.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
    });
    await settleUi();
  }
}
