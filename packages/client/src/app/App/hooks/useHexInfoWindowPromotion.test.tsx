import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import type { Tile } from '../../../game/stateTypes';
import { createWindowVisibilityState } from '../../constants';
import { useHexInfoWindowPromotion } from './useHexInfoWindowPromotion';

describe('useHexInfoWindowPromotion', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('keeps hex content open after a manual toggle on an empty hex', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 0, r: 0 },
      currentStructure: undefined,
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('false');

    await act(async () => {
      (host.querySelector('button') as HTMLButtonElement | null)?.click();
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('true');

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 0, r: 0 },
      currentStructure: undefined,
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('true');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('allows closing hex content after a manual toggle on an empty hex', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 0, r: 0 },
      currentStructure: undefined,
    });

    await act(async () => {
      (host.querySelector('button') as HTMLButtonElement | null)?.click();
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('true');

    await act(async () => {
      (host.querySelector('button') as HTMLButtonElement | null)?.click();
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('false');

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 0, r: 0 },
      currentStructure: undefined,
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('false');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('allows closing hex content while a structure auto-open reason remains active', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 0, r: 0 },
      currentStructure: 'forge',
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('true');

    await act(async () => {
      (host.querySelector('button') as HTMLButtonElement | null)?.click();
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('false');

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 0, r: 0 },
      currentStructure: 'forge',
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('false');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('auto-closes hex content after leaving a structured hex for an empty hex', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 0, r: 0 },
      currentStructure: 'forge',
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('true');

    await renderHarness(root, {
      currentLootAvailable: false,
      playerCoord: { q: 1, r: 0 },
      currentStructure: undefined,
    });
    expect(host.firstElementChild?.getAttribute('data-opened')).toBe('false');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

function Harness({
  currentLootAvailable,
  playerCoord,
  currentStructure,
}: {
  currentLootAvailable: boolean;
  playerCoord: { q: number; r: number };
  currentStructure: Tile['structure'];
}) {
  const [windowShown, setWindowShown] = useState(() =>
    createWindowVisibilityState(false),
  );

  useHexInfoWindowPromotion({
    combat: null,
    currentLootAvailable,
    playerCoord,
    currentStructure,
    suppressAutoOpen: false,
    setWindowShown,
    windowShown,
  });

  return (
    <>
      <div data-opened={windowShown.hexInfo ? 'true' : 'false'} />
      <button
        type="button"
        onClick={() =>
          setWindowShown((current) => ({
            ...current,
            hexInfo: !current.hexInfo,
          }))
        }
      >
        toggle
      </button>
    </>
  );
}

async function renderHarness(
  root: ReturnType<typeof createRoot>,
  props: Parameters<typeof Harness>[0],
) {
  await act(async () => {
    root.render(<Harness {...props} />);
  });
}
