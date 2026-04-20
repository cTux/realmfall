import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
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
  });

  it('ignores repeated action bar hotkeys', async () => {
    const onUseActionBarSlot = vi.fn();

    function TestHarness() {
      useKeyboardShortcuts({
        combatStartAvailable: false,
        interactLabel: null,
        lootSnapshotLength: 0,
        lootWindowVisible: false,
        onStartCombat: vi.fn(),
        keepLootWindowMounted: false,
        onInteract: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot,
        windowShown: {
          hero: false,
          skills: false,
          recipes: false,
          hexInfo: false,
          equipment: false,
          inventory: false,
          loot: false,
          log: false,
          combat: false,
          settings: false,
        },
        windowShownLoot: false,
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: '1' }),
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: '1',
          repeat: true,
        }),
      );
    });

    expect(onUseActionBarSlot).toHaveBeenCalledTimes(1);
    expect(onUseActionBarSlot).toHaveBeenCalledWith(0);
  });
});
