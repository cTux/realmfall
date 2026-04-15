import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { DebuggerWindowContent } from './DebuggerWindowContent';

describe('DebuggerWindowContent', () => {
  it('renders the debugger timestamp and fps graph without invalid element errors', async () => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root: Root = createRoot(host);

    await act(async () => {
      root.render(
        <DebuggerWindowContent
          worldTimeMs={0}
          onHoverDetail={() => undefined}
          onLeaveDetail={() => undefined}
        />,
      );
    });

    expect(host.querySelector('[aria-label="Debugger"]')).not.toBeNull();
    expect(host.textContent).toContain('Day 1');

    await act(async () => {
      root.unmount();
    });

    host.remove();
  });
});
