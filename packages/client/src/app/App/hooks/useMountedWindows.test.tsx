import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_WINDOW_VISIBILITY } from '../../constants';
import { useMountedWindows } from './useMountedWindows';

describe('useMountedWindows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps pending unmount timers alive across unrelated rerenders', async () => {
    let latestMountedWindows: { skills: boolean } | null = null;

    function Harness({
      tick,
      windowShown,
    }: {
      tick: number;
      windowShown: typeof DEFAULT_WINDOW_VISIBILITY;
    }) {
      void tick;
      const mountedWindows = useMountedWindows({
        windowShown,
        keepLootWindowMounted: false,
        keepCombatWindowMounted: false,
      });
      latestMountedWindows = { skills: mountedWindows.skills };

      return null;
    }

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<Harness tick={0} windowShown={DEFAULT_WINDOW_VISIBILITY} />);
    });

    await act(async () => {
      root.render(
        <Harness
          tick={1}
          windowShown={{ ...DEFAULT_WINDOW_VISIBILITY, skills: true }}
        />,
      );
    });

    expect(latestMountedWindows).not.toBeNull();
    expect(latestMountedWindows!.skills).toBe(true);

    await act(async () => {
      root.render(<Harness tick={2} windowShown={DEFAULT_WINDOW_VISIBILITY} />);
    });

    expect(latestMountedWindows).not.toBeNull();
    expect(latestMountedWindows!.skills).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(100);
      root.render(<Harness tick={3} windowShown={DEFAULT_WINDOW_VISIBILITY} />);
    });

    expect(latestMountedWindows).not.toBeNull();
    expect(latestMountedWindows!.skills).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(latestMountedWindows).not.toBeNull();
    expect(latestMountedWindows!.skills).toBe(false);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
