import { act, type ReactElement } from 'react';
import { vi, expect } from 'vitest';
import type { LogEntry } from '@realmfall/core/game/stateTypes';
import { mountUi, settleUi } from '../../../uiTestHelpers';
import { LogWindowContent } from '../LogWindowContent';
import type { LogWindowProps } from '../types';
import { ensureReactActEnvironment } from './utils/environment';
import { findLogList, findSegmentByText } from './utils/dom';

export class LogWindowContentTestkit {
  readonly mock = {
    onHoverDetail: vi.fn(),
    onLeaveDetail: vi.fn(),
  };

  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  constructor() {
    ensureReactActEnvironment();
    vi.useFakeTimers();
  }

  readonly actions = {
    render: async (
      logs: LogEntry[],
      options: Pick<
        LogWindowProps,
        'showTooltipTags' | 'onHoverDetail' | 'onLeaveDetail'
      > = {},
    ) => {
      const onHoverDetail = options.onHoverDetail ?? this.mock.onHoverDetail;
      const onLeaveDetail = options.onLeaveDetail ?? this.mock.onLeaveDetail;

      await this.mount(
        <LogWindowContent
          logs={logs}
          showTooltipTags={options.showTooltipTags}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />,
      );
    },
    hoverSegment: async (text: string) => {
      const segment = this.findSegment(text);
      if (!segment) {
        return;
      }

      await act(async () => {
        segment.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      });
      await settleUi();
    },
    unhoverSegment: async (text: string) => {
      const segment = this.findSegment(text);
      if (!segment) {
        return;
      }

      await act(async () => {
        segment.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      });
      await settleUi();
    },
    scrollToBottom: async () => {
      const list = this.logList();
      if (!list) {
        return;
      }

      await act(async () => {
        list.scrollTop = 100_000;
        list.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await settleUi();
    },
  };

  readonly expect = {
    hasText: async (text: string) => {
      expect(this.hostText()).toContain(text);
    },
    missingText: async (text: string) => {
      expect(this.hostText()).not.toContain(text);
    },
    hasVirtualizedList: async () => {
      expect(findLogList(this.host())).toBeTruthy();
    },
    noCursor: async () => {
      expect(this.host().querySelector('[class*="logCursor"]')).toBeNull();
    },
    segmentExists: async (text: string) => {
      expect(this.findSegment(text)).toBeDefined();
    },
    segmentHasIcon: async (text: string) => {
      const segment = this.findSegment(text);

      expect(segment?.querySelector('[aria-hidden="true"]')).not.toBeNull();
    },
    hoveredWithColor: async (
      title: string,
      color: string,
      lineMatcher: Array<unknown> | undefined = undefined,
    ) => {
      const lastCall = this.lastHoverCall();
      expect(lastCall?.[1]).toBe(title);
      expect(lastCall?.[3]).toBe(color);
      if (lineMatcher) {
        expect(lastCall?.[2]).toEqual(expect.arrayContaining(lineMatcher));
      }
    },
    hoverCallForTitle: async (title: string) => {
      expect(
        this.mock.onHoverDetail.mock.calls.some(
          ([, callbackTitle]) => callbackTitle === title,
        ),
      ).toBe(true);
    },
    leaveCalled: async () => {
      expect(this.mock.onLeaveDetail).toHaveBeenCalled();
    },
    logListScrollTopPositive: async () => {
      const list = this.logList();
      expect(list?.scrollTop).toBeGreaterThan(0);
    },
  };

  async restore() {
    try {
      if (this.mountedUi) {
        await this.mountedUi.unmount();
      }
    } finally {
      this.mountedUi = null;
      vi.restoreAllMocks();
      vi.useRealTimers();
    }
  }

  private async mount(node: ReactElement) {
    if (this.mountedUi) {
      await this.mountedUi.render(node);
      return;
    }

    this.mountedUi = await mountUi(node);
  }

  private hostText() {
    return this.host().textContent ?? '';
  }

  private host() {
    const host = this.mountedUi?.host;
    if (!host) {
      throw new Error('LogWindowContent testkit is not mounted.');
    }
    return host;
  }

  private lastHoverCall() {
    const calls = this.mock.onHoverDetail.mock.calls;
    const last = calls[calls.length - 1];
    if (!last) {
      throw new Error('Expected onHoverDetail to have been called.');
    }
    return last;
  }

  private logList() {
    const list = findLogList(this.host()) as HTMLDivElement | null;
    if (!list) {
      return null;
    }
    return list;
  }

  private findSegment(text: string) {
    return findSegmentByText(this.host(), text);
  }
}
