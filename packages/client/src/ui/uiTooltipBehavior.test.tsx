import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import { getTooltipPlacementForRect } from './tooltipPlacement';
import { GameTooltip } from './components/GameTooltip';
import { syncFollowCursorTooltipPosition } from './components/GameTooltip/followCursorSync';
import { rarityColor } from './rarity';
import { setupUiTestEnvironment } from './uiTestHelpers';

setupUiTestEnvironment();

describe('ui tooltip behavior', () => {
  it('chooses anchored placements that stay visible', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <GameTooltip
          tooltip={{
            title: 'Town',
            x: 120,
            y: 80,
            placement: 'left',
            lines: [{ kind: 'text', text: 'Safe rest and trade.' }],
          }}
        />,
      );
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.style.transform).toBe('translateX(-100%)');

    expect(
      getTooltipPlacementForRect(
        {
          left: 280,
          right: 320,
          top: 80,
          bottom: 120,
          width: 40,
        },
        {
          viewportWidth: 360,
          viewportHeight: 280,
          tooltipWidth: 260,
          tooltipHeight: 120,
        },
      ),
    ).toMatchObject({
      x: 218,
      y: 132,
      placement: 'bottom',
    });

    expect(
      getTooltipPlacementForRect(
        {
          left: 200,
          right: 240,
          top: 20,
          bottom: 60,
          width: 40,
        },
        {
          preferredPlacements: ['top', 'right', 'left', 'bottom'],
          viewportWidth: 520,
          viewportHeight: 260,
          tooltipWidth: 220,
          tooltipHeight: 120,
        },
      ),
    ).toMatchObject({
      x: 252,
      y: 20,
      placement: 'right',
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('centers bottom-placed tooltips beneath the anchor', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <GameTooltip
          tooltip={{
            title: 'Town',
            x: 180,
            y: 120,
            placement: 'bottom',
            lines: [{ kind: 'text', text: 'Safe rest and trade.' }],
          }}
        />,
      );
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.style.getPropertyValue('--tooltip-transform')).toBe(
      'translateX(-50%)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('animates tooltip visibility changes without blinking on position-only updates', async () => {
    vi.useFakeTimers();

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const tooltipData = {
      title: 'Knight Blade',
      x: 50,
      y: 70,
      borderColor: rarityColor('rare'),
      lines: [{ kind: 'text' as const, text: 'RARE TIER 2 WEAPON' }],
    };

    await act(async () => {
      root.render(<GameTooltip tooltip={tooltipData} />);
    });

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    let tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.dataset.tooltipVisible).toBe('true');

    await act(async () => {
      root.render(<GameTooltip tooltip={{ ...tooltipData, x: 90, y: 120 }} />);
    });

    tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.dataset.tooltipVisible).toBe('true');
    expect(tooltip.style.left).toBe('90px');
    expect(tooltip.style.top).toBe('120px');

    await act(async () => {
      root.render(<GameTooltip tooltip={null} />);
    });
    expect(tooltip.dataset.tooltipVisible).toBe('false');

    await act(async () => {
      vi.advanceTimersByTime(160);
    });

    expect(host.querySelector('div[class*="tooltip"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('follows pointer refs without changing tooltip visibility', async () => {
    vi.useFakeTimers();

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const positionRef = {
      current: { x: 50, y: 70 },
    };

    await act(async () => {
      root.render(
        <GameTooltip
          tooltip={{
            title: 'Rift Ruin',
            x: 50,
            y: 70,
            followCursor: true,
            borderColor: '#a855f7',
            lines: [{ kind: 'text', text: 'Enemies gather here.' }],
          }}
          positionRef={positionRef}
        />,
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    positionRef.current = { x: 110, y: 130 };

    await act(async () => {
      syncFollowCursorTooltipPosition(positionRef.current);
    });

    const tooltip = host.querySelector('div[class*="tooltip"]') as HTMLElement;
    expect(tooltip.dataset.tooltipVisible).toBe('true');
    expect(tooltip.style.left).toBe('110px');
    expect(tooltip.style.top).toBe('130px');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
