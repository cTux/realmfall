import * as timeOfDay from '../../../world/timeOfDay';
import { vi } from 'vitest';
import { LogWindowContentTestkit } from './LogWindowContentTestkit';
import { createSystemLog } from './utils/fixtures';

describe('LogWindowContent metadata', () => {
  let testkit: LogWindowContentTestkit;

  beforeEach(() => {
    testkit = new LogWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
    vi.restoreAllMocks();
  });

  it('reuses parsed metadata for unchanged log entries across rerenders', async () => {
    const parseSpy = vi.spyOn(timeOfDay, 'parseWorldCalendarDateTime');
    const olderLog = createSystemLog({
      id: 'log-1',
      turn: 1,
      text: '[Year 1, Day 1, 00:00] Hunt',
    });
    const newerLog = createSystemLog({
      id: 'log-2',
      turn: 2,
      text: '[Year 1, Day 1, 00:01] Rest',
    });

    await testkit.actions.render([olderLog]);
    expect(parseSpy).toHaveBeenCalledTimes(1);

    await testkit.actions.render([newerLog, olderLog]);
    expect(parseSpy).toHaveBeenCalledTimes(2);
  });

  it('scrolls the log to the newest row when a new entry appears', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLDivElement.prototype,
      'scrollHeight',
    );

    Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return this.textContent?.length ?? 0;
      },
    });

    try {
      await testkit.actions.render([
        createSystemLog({
          id: 'log-scroll-follow',
          turn: 1,
          text: '[Year 1, Day 1, 00:00] This newest line is deliberately long so it pushes the scroll position down when it is added.',
        }),
      ]);

      await testkit.expect.logListScrollTopPositive();
    } finally {
      if (descriptor) {
        Object.defineProperty(
          HTMLDivElement.prototype,
          'scrollHeight',
          descriptor,
        );
      } else {
        delete (HTMLDivElement.prototype as { scrollHeight?: number })
          .scrollHeight;
      }
    }
  });
});
