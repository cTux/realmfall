import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useAudioBridgeActivation } from './useAudioBridgeActivation';

describe('useAudioBridgeActivation', () => {
  let host: HTMLDivElement;
  let root: Root;
  let latestActivated = false;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    latestActivated = false;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('activates audio bridge loading after the first user gesture', async () => {
    await act(async () => {
      root.render(<AudioBridgeActivationHarness />);
    });

    expect(latestActivated).toBe(false);

    await act(async () => {
      document.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
        }),
      );
    });

    expect(latestActivated).toBe(true);
  });

  function AudioBridgeActivationHarness() {
    latestActivated = useAudioBridgeActivation();
    return null;
  }
});
