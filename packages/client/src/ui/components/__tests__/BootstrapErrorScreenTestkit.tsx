import { act } from 'react';
import { expect, vi } from 'vitest';
import { mountUi, settleUi } from '../../uiTestHelpers';
import { BootstrapErrorScreen } from '../BootstrapErrorScreen';

export class BootstrapErrorScreenTestkit {
  readonly mock = {
    reloadPage: vi.fn(),
  };

  readonly actions = {
    advanceTime: async (milliseconds: number) => {
      await this.whenReady();
      await act(async () => {
        vi.advanceTimersByTime(milliseconds);
      });
      await settleUi();
    },
  };

  readonly expect = {
    countdownMessageShows: async (seconds: number) => {
      await this.whenReady();
      expect(this.screenText()).toContain(
        `Trying to recover automatically in ${seconds} sec.`,
      );
    },
    loadingTitleVisible: async () => {
      await this.whenReady();
      expect(this.screenText()).toContain('Realmfall failed to load.');
    },
    reloadNotCalled: async () => {
      await this.whenReady();
      expect(this.reloadPageHandler).not.toHaveBeenCalled();
    },
    reloadTriggered: async () => {
      await this.whenReady();
      expect(this.reloadPageHandler).toHaveBeenCalledTimes(1);
    },
  };

  private readonly ready: Promise<void>;
  private reloadPageHandler: () => void;
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  constructor(
    overrides: Partial<{
      reloadPage: () => void;
    }> = {},
  ) {
    vi.useFakeTimers();
    this.reloadPageHandler = overrides.reloadPage ?? this.mock.reloadPage;

    this.ready = mountUi(
      <BootstrapErrorScreen reloadPage={this.reloadPageHandler} />,
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

    vi.useRealTimers();
  }

  private async whenReady() {
    await this.ready;
  }

  private screenText() {
    const host = this.mountedUi?.host;
    return host?.textContent ?? '';
  }
}
