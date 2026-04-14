import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import type { TooltipLine } from '../../tooltips';
import { StorybookPreviewRuntime } from './storybookPreview';

describe('StorybookPreviewRuntime', () => {
  it('injects hover-detail handlers that render the shared tooltip', async () => {
    vi.useFakeTimers();
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    const Story = (props?: {
      args?: {
        onHoverDetail?: (
          event: React.MouseEvent<HTMLElement>,
          title: string,
          lines: TooltipLine[],
          borderColor?: string,
        ) => void;
        onLeaveDetail?: () => void;
      };
    }) => {
      const args = props?.args;

      return (
        <button
          type="button"
          onMouseOver={(event) =>
            args?.onHoverDetail?.(
              event,
              'Scout Hood',
              [{ kind: 'text', text: 'Tier 1 armor' }],
              '#94a3b8',
            )
          }
          onMouseOut={() => args?.onLeaveDetail?.()}
        >
          Hover detail
        </button>
      );
    };

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root: Root = createRoot(host);

    await act(async () => {
      root.render(
        <StorybookPreviewRuntime
          Story={Story}
          args={{
            onHoverDetail: () => undefined,
            onLeaveDetail: () => undefined,
          }}
        />,
      );
    });

    const button = host.querySelector('button');
    expect(button).not.toBeNull();

    await act(async () => {
      button?.dispatchEvent(
        new MouseEvent('mouseover', {
          bubbles: true,
          clientX: 40,
          clientY: 20,
        }),
      );
      await Promise.resolve();
    });

    expect(host.textContent).toContain('Scout Hood');
    expect(host.textContent).toContain('Tier 1 armor');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      vi.advanceTimersByTime(160);
      await Promise.resolve();
    });

    const tooltip = host.querySelector('[data-tooltip-visible]');
    expect(tooltip?.getAttribute('data-tooltip-visible')).toBe('false');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
