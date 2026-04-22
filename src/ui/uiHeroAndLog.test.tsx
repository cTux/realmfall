import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { DEFAULT_LOG_FILTERS, DEFAULT_WINDOWS } from '../app/constants';
import { createGame } from '../game/stateFactory';
import { HeroWindow } from './components/HeroWindow';
import { LogWindow } from './components/LogWindow';
import { LogWindowContent } from './components/LogWindow/LogWindowContent';
import { renderMarkup, setupUiTestEnvironment } from './uiTestHelpers';

setupUiTestEnvironment();

describe('ui hero and log surfaces', () => {
  it('renders hero stat bars with compact large values', async () => {
    const markup = await renderMarkup(
      <HeroWindow
        position={DEFAULT_WINDOWS.hero}
        onMove={() => {}}
        visible
        onClose={() => {}}
        hunger={100}
        stats={{
          level: 10,
          masteryLevel: 0,
          hp: 1127,
          maxHp: 1128,
          mana: 25,
          maxMana: 30,
          xp: 450,
          nextLevelXp: 1000,
          rawAttack: 20,
          rawDefense: 15,
          attack: 20,
          defense: 15,
          statusEffects: [],
          buffs: [],
          debuffs: [],
          abilityIds: ['kick'],
          skills: {
            gathering: { level: 1, xp: 0 },
            logging: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 },
            skinning: { level: 1, xp: 0 },
            fishing: { level: 1, xp: 0 },
            cooking: { level: 1, xp: 0 },
            smelting: { level: 1, xp: 0 },
            crafting: { level: 1, xp: 0 },
          },
        }}
      />,
    );

    expect(markup).toContain('1.1k/1.1k');
    expect(markup).toContain('HP');
    expect(markup).toContain('Mana');
    expect(markup).toContain('XP');
    expect(markup).toContain('Hunger');
  });

  it('renders mastery level in the hero title after level 100', () => {
    const markup = renderToStaticMarkup(
      <HeroWindow
        position={DEFAULT_WINDOWS.hero}
        onMove={() => {}}
        visible
        onClose={() => {}}
        hunger={100}
        stats={{
          level: 100,
          masteryLevel: 1,
          hp: 100,
          maxHp: 100,
          mana: 20,
          maxMana: 20,
          xp: 100,
          nextLevelXp: 1000,
          rawAttack: 20,
          rawDefense: 15,
          attack: 20,
          defense: 15,
          statusEffects: [],
          buffs: [],
          debuffs: [],
          abilityIds: ['kick'],
          skills: {
            gathering: { level: 1, xp: 0 },
            logging: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 },
            skinning: { level: 1, xp: 0 },
            fishing: { level: 1, xp: 0 },
            cooking: { level: 1, xp: 0 },
            smelting: { level: 1, xp: 0 },
            crafting: { level: 1, xp: 0 },
          },
        }}
      />,
    );

    expect(markup).toContain('Lv 100 (1)');
  });

  it('animates log text like a terminal line', async () => {
    vi.useFakeTimers();

    const game = createGame(2, 'log-animation-test');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs.slice(0, 1)}
        />,
      );
    });

    expect(host.textContent).toContain('Lo(g)');
    expect(host.textContent).not.toContain(game.logs[0]?.text ?? '');
    expect(host.textContent).toContain('00:00');

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    expect(host.textContent).toContain('00:00');
    expect(host.textContent).toContain(
      (game.logs[0]?.text ?? '').replace(/^\[.*?\]\s/, ''),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('scrolls the log window to the newest message', async () => {
    vi.useFakeTimers();
    const game = createGame(2, 'log-scroll-test');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLDivElement.prototype,
      'scrollHeight',
    );
    Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 240,
    });

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs.slice(0, 2)}
        />,
      );
    });

    const logList = host.querySelector(
      'div[class*="logList"]',
    ) as HTMLDivElement;

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs}
        />,
      );
      vi.runOnlyPendingTimers();
    });

    expect(logList.scrollTop).toBe(240);

    await act(async () => {
      vi.runOnlyPendingTimers();
      root.unmount();
    });
    if (scrollHeightDescriptor) {
      Object.defineProperty(
        HTMLDivElement.prototype,
        'scrollHeight',
        scrollHeightDescriptor,
      );
    } else {
      delete (HTMLDivElement.prototype as { scrollHeight?: number })
        .scrollHeight;
    }
    vi.useRealTimers();
    host.remove();
  });

  it('marks moon logs with dedicated styles', async () => {
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={false}
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={[
            {
              id: 'blood-moon-log',
              kind: 'combat',
              text: '[Year 1, Day 5, 18:00] Blood moon begins. A red hunger sweeps the wilds.',
              turn: 12,
            },
            {
              id: 'harvest-moon-log',
              kind: 'system',
              text: '[Year 1, Day 5, 18:00] Harvest moon rises. A cyan glow stirs the wild herbs and veins.',
              turn: 12,
            },
          ]}
        />,
      );
      vi.advanceTimersByTime(2_000);
    });

    expect(host.querySelector('div[class*="bloodMoon"]')).not.toBeNull();
    expect(host.querySelector('div[class*="harvestMoon"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders rich combat log segments', async () => {
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const onHoverDetail = vi.fn();
    const onLeaveDetail = vi.fn();

    await act(async () => {
      root.render(
        <LogWindowContent
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
          logs={[
            {
              id: 'rich-combat-log',
              kind: 'combat',
              text: '[Year 1, Day 5, 18:00] The Marauder deals 12 to you with Fireball.',
              turn: 12,
              richText: [
                { kind: 'entity', text: 'Marauder', rarity: 'epic' },
                { kind: 'text', text: ' deals ' },
                { kind: 'damage', text: '12' },
                { kind: 'text', text: ' to you with ' },
                {
                  kind: 'source',
                  text: 'Fireball',
                  source: {
                    kind: 'ability',
                    abilityId: 'fireball',
                    attack: 12,
                  },
                },
                { kind: 'text', text: '.' },
              ],
            },
          ]}
        />,
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });

    const sourceLabel = Array.from(host.querySelectorAll('span')).find((node) =>
      node.textContent?.includes('Fireball'),
    ) as HTMLSpanElement | undefined;
    const source = sourceLabel?.parentElement as HTMLSpanElement | null;

    expect(source).not.toBeNull();
    expect(source?.textContent).toContain('Fireball');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
