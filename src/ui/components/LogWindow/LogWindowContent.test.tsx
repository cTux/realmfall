import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as timeOfDay from '../../world/timeOfDay';
import { LogWindowContent } from './LogWindowContent';

describe('LogWindowContent', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    vi.restoreAllMocks();
  });

  it('reveals the newest log entry in larger chunks before completing', async () => {
    await act(async () => {
      root.render(
        <LogWindowContent
          logs={[
            {
              id: 'log-1',
              kind: 'system',
              text: 'Hunt',
              turn: 1,
            },
          ]}
        />,
      );
    });

    expect(host.textContent).toContain('#');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32);
    });

    expect(host.textContent).toContain('Hu');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32);
    });

    expect(host.textContent).toContain('Hunt');
    expect(host.textContent).not.toContain('#');
  });

  it('shows status effect source icons with hover details', async () => {
    const onHoverDetail = vi.fn();
    const onLeaveDetail = vi.fn();

    await act(async () => {
      root.render(
        <LogWindowContent
          logs={[
            {
              id: 'log-1',
              kind: 'combat',
              text: 'You apply Shocked with Fireball.',
              turn: 1,
              richText: [
                { kind: 'text', text: 'You apply ' },
                {
                  kind: 'source',
                  text: 'Shocked',
                  source: {
                    kind: 'statusEffect',
                    effectId: 'shocked',
                    tone: 'debuff',
                  },
                },
                { kind: 'text', text: ' with ' },
                {
                  kind: 'source',
                  text: 'Fireball',
                  source: {
                    kind: 'ability',
                    abilityId: 'fireball',
                  },
                },
                { kind: 'text', text: '.' },
              ],
            },
          ]}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />,
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(320);
    });

    const sourceSegments = host.querySelectorAll('span[class]');
    const shockedSegment = [...sourceSegments].find(
      (node) => node.textContent === 'Shocked',
    ) as HTMLSpanElement | undefined;
    expect(shockedSegment).toBeDefined();
    expect(shockedSegment?.querySelector('[aria-hidden="true"]')).not.toBeNull();

    await act(async () => {
      shockedSegment?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(onHoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      'Shocked',
      expect.any(Array),
      'rgba(239, 68, 68, 0.9)',
    );

    await act(async () => {
      shockedSegment?.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true }),
      );
    });

    expect(onLeaveDetail).toHaveBeenCalled();
  });

  it('reuses parsed metadata for unchanged log entries across rerenders', async () => {
    const parseSpy = vi.spyOn(timeOfDay, 'parseWorldCalendarDateTime');
    const olderLog = {
      id: 'log-1',
      kind: 'system' as const,
      text: '[Year 1, Day 1, 00:00] Hunt',
      turn: 1,
    };
    const newerLog = {
      id: 'log-2',
      kind: 'system' as const,
      text: '[Year 1, Day 1, 00:01] Rest',
      turn: 2,
    };

    await act(async () => {
      root.render(<LogWindowContent logs={[olderLog]} />);
    });

    expect(parseSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.render(<LogWindowContent logs={[newerLog, olderLog]} />);
    });

    expect(parseSpy).toHaveBeenCalledTimes(2);
  });
});
