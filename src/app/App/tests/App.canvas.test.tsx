import { act } from 'react';
import {
  applicationOptions,
  flushLazyModules,
  loadEncryptedState,
} from './appTestHarness';

describe('App canvas setup', () => {
  it('creates the Pixi canvas with density-aware sizing', async () => {
    vi.stubGlobal('devicePixelRatio', 1.5);
    loadEncryptedState.mockResolvedValue(null);

    const { App } = await import('../index');
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { value: 800 });
    Object.defineProperty(host, 'clientHeight', { value: 600 });
    document.body.appendChild(host);
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(host);

    await act(async () => {
      root.render(<App />);
    });
    await flushLazyModules();

    expect(applicationOptions[0]).toMatchObject({
      autoDensity: true,
      resolution: 1.5,
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
