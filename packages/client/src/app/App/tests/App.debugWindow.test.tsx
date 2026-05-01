import { act } from 'react';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

describe('App debug window', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('does not expose the debug dock entry without the debug query param', async () => {
    loadEncryptedState.mockResolvedValue(null);

    const { host, root } = await renderApp();

    expect(host.querySelector('[aria-label="Toggle Debug window"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 20_000);

  it('shows the debug dock entry and adds debug-created drop items to inventory when enabled', async () => {
    window.history.replaceState({}, '', '/?debug=true');
    loadEncryptedState.mockResolvedValue(null);

    const { host, root } = await renderApp();

    const debugDockButton = host.querySelector(
      '[aria-label="Toggle Debug window"]',
    ) as HTMLButtonElement | null;
    expect(debugDockButton).not.toBeNull();

    await act(async () => {
      debugDockButton?.click();
    });
    await flushLazyModules();
    await flushLazyModules();

    const platinumOreButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Platinum Ore',
    );
    expect(platinumOreButton).toBeDefined();

    await act(async () => {
      platinumOreButton?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });
    await flushLazyModules();

    const inventoryDockButton = host.querySelector(
      '[aria-label="Toggle Inventory window"]',
    ) as HTMLButtonElement | null;
    expect(inventoryDockButton).not.toBeNull();

    await act(async () => {
      inventoryDockButton?.click();
    });
    await flushLazyModules();
    await flushLazyModules();

    expect(host.textContent).toContain('Platinum Ore');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 20_000);
});
