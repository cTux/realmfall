import { act } from 'react';
import { expect, vi } from 'vitest';
import { t } from '../../../../i18n';
import { mountUi, settleUi } from '../../../uiTestHelpers';
import { VersionStatusWidget } from '../VersionStatusWidget';

export class VersionStatusWidgetTestkit {
  readonly mock = {
    onRefresh: vi.fn(),
    onHoverDetail: vi.fn(),
    onLeaveDetail: vi.fn(),
  };

  readonly actions = {
    clickRefresh: async () => {
      await this.whenReady();
      await this.dispatchButtonEvent('click', this.refreshButton());
    },
    hoverRefresh: async () => {
      await this.whenReady();
      await this.dispatchButtonEvent('mouseover', this.refreshButton());
    },
    unhoverRefresh: async () => {
      await this.whenReady();
      await this.dispatchButtonEvent('mouseout', this.refreshButton());
    },
  };

  readonly expect = {
    leaveTooltipTriggered: async () => {
      await this.whenReady();
      expect(this.mock.onLeaveDetail).toHaveBeenCalledTimes(1);
    },
    onRefreshCalled: async () => {
      await this.whenReady();
      expect(this.mock.onRefresh).toHaveBeenCalledTimes(1);
    },
    refreshButtonVisible: async () => {
      await this.whenReady();
      expect(this.refreshButton()?.textContent).toBe(
        t('ui.version.refreshAction'),
      );
    },
    refreshHoverShowsVersionInfo: async ({
      currentVersion,
      remoteVersion,
    }: {
      currentVersion: string;
      remoteVersion: string;
    }) => {
      await this.whenReady();
      expect(this.mock.onHoverDetail).toHaveBeenCalledWith(
        expect.any(Object),
        t('ui.version.refreshAction'),
        [
          {
            kind: 'text',
            text: t('ui.version.currentValue', { version: currentVersion }),
          },
          {
            kind: 'text',
            text: t('ui.version.remoteValue', { version: remoteVersion }),
          },
        ],
        'rgba(248, 113, 113, 0.9)',
      );
    },
  };

  private readonly ready: Promise<void>;
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  constructor() {
    this.ready = mountUi(
      <VersionStatusWidget
        currentVersion="1.0.0"
        remoteVersion="1.0.1"
        status="outdated"
        onRefresh={this.mock.onRefresh}
        onHoverDetail={this.mock.onHoverDetail}
        onLeaveDetail={this.mock.onLeaveDetail}
      />,
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

  private refreshButton() {
    return Array.from(
      this.mountedUi?.host.querySelectorAll('button') ?? [],
    ).find(
      (candidate) => candidate.textContent === t('ui.version.refreshAction'),
    );
  }

  private async dispatchButtonEvent(
    eventType: string,
    button: HTMLButtonElement | undefined | null,
  ) {
    await act(async () => {
      button?.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
    });
    await settleUi();
  }
}
