import { act } from 'react';
import { expect, vi } from 'vitest';
import { mountUi, settleUi } from '../../uiTestHelpers';
import { WindowLoadingState } from '../WindowLoadingState';

export class WindowLoadingStateTestkit {
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
    notShowingWarning: async (expected: string) => {
      await this.whenReady();
      expect(this.hostText()).not.toContain(expected);
    },
    showingWarning: async (expected: string) => {
      await this.whenReady();
      expect(this.hostText()).toContain(expected);
    },
  };

  private readonly ready: Promise<void>;
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  constructor() {
    vi.useFakeTimers();
    this.ready = mountUi(<WindowLoadingState />).then((mountedUi) => {
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

  private hostText() {
    return this.mountedUi?.host.textContent ?? '';
  }
}
