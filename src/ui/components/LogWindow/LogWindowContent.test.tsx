import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GameTag } from '../../../game/content/tags';
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

  it('renders the newest log entry immediately', async () => {
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

    expect(host.textContent).toContain('Hunt');
    expect(host.querySelector('[class*="logCursor"]')).toBeNull();
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

    const sourceSegments = host.querySelectorAll('span[class]');
    const shockedSegment = [...sourceSegments].find(
      (node) => node.textContent === 'Shocked',
    ) as HTMLSpanElement | undefined;
    expect(shockedSegment).toBeDefined();
    expect(
      shockedSegment?.querySelector('[aria-hidden="true"]'),
    ).not.toBeNull();

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

  it('shows hover details for enemy entities and combat stat sources', async () => {
    const onHoverDetail = vi.fn();

    await act(async () => {
      root.render(
        <LogWindowContent
          logs={[
            {
              id: 'log-entity-tooltip',
              kind: 'combat',
              text: 'Marauder critically hits you. You are healed for 6 through Lifesteal.',
              turn: 1,
              richText: [
                {
                  kind: 'entity',
                  text: 'Marauder',
                  rarity: 'rare',
                  enemy: {
                    id: 'enemy-1',
                    name: 'Marauder',
                    coord: { q: 0, r: 0 },
                    tier: 3,
                    hp: 20,
                    maxHp: 20,
                    attack: 12,
                    defense: 4,
                    xp: 1,
                    elite: false,
                    abilityIds: ['fireball'],
                    statusEffects: [],
                    rarity: 'rare',
                    tags: [GameTag.EnemyHumanoid],
                  },
                },
                {
                  kind: 'text',
                  text: ' critically hits you. You are healed for ',
                },
                { kind: 'healing', text: '6' },
                { kind: 'text', text: ' through ' },
                {
                  kind: 'source',
                  text: 'Lifesteal',
                  source: {
                    kind: 'secondaryStat',
                    stat: 'lifestealAmount',
                  },
                },
                { kind: 'text', text: '.' },
              ],
            },
          ]}
          onHoverDetail={onHoverDetail}
        />,
      );
    });

    const segments = Array.from(host.querySelectorAll('span[class]'));
    const entitySegment = segments.find(
      (node) => node.textContent === 'Marauder',
    ) as HTMLSpanElement | undefined;

    await act(async () => {
      entitySegment?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(
      onHoverDetail.mock.calls.some(
        ([, title, lines]) =>
          title === 'Marauder' && Array.isArray(lines) && lines.length > 0,
      ),
    ).toBe(true);

    await act(async () => {
      root.render(
        <LogWindowContent
          logs={[
            {
              id: 'log-stat-tooltip',
              kind: 'combat',
              text: 'You are healed for 6 through Lifesteal.',
              turn: 2,
              richText: [
                { kind: 'text', text: 'You are healed for ' },
                { kind: 'healing', text: '6' },
                { kind: 'text', text: ' through ' },
                {
                  kind: 'source',
                  text: 'Lifesteal',
                  source: {
                    kind: 'secondaryStat',
                    stat: 'lifestealAmount',
                  },
                },
                { kind: 'text', text: '.' },
              ],
            },
          ]}
          onHoverDetail={onHoverDetail}
        />,
      );
    });

    const statOnlySegment = host.querySelector(
      'span[class*="sourceSegment"]',
    ) as HTMLSpanElement | null;

    await act(async () => {
      statOnlySegment?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(
      onHoverDetail.mock.calls.some(
        ([, title, lines]) => title === 'Lifesteal' && Array.isArray(lines),
      ),
    ).toBe(true);
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

  it('scrolls the log to the newest row when a new entry appears', async () => {
    const originalScrollHeightDescriptor = Object.getOwnPropertyDescriptor(
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
      await act(async () => {
        root.render(
          <LogWindowContent
            logs={[
              {
                id: 'log-scroll-follow',
                kind: 'system',
                text: '[Year 1, Day 1, 00:00] This newest line is deliberately long so it pushes the scroll position down when it is added.',
                turn: 1,
              },
            ]}
          />,
        );
      });

      const logList = host.querySelector('div') as HTMLDivElement;

      expect(logList.scrollTop).toBe(logList.scrollHeight);
    } finally {
      if (originalScrollHeightDescriptor) {
        Object.defineProperty(
          HTMLDivElement.prototype,
          'scrollHeight',
          originalScrollHeightDescriptor,
        );
      } else {
        delete (HTMLDivElement.prototype as { scrollHeight?: number })
          .scrollHeight;
      }
    }
  });
});
