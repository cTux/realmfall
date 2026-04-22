import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function buildWindowShown(hexInfo = false) {
  return {
    hero: false,
    skills: false,
    recipes: false,
    hexInfo,
    equipment: false,
    inventory: false,
    loot: false,
    log: false,
    combat: false,
    settings: false,
  };
}

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
        canBulkProspectEquipment: false,
        canBulkSellEquipment: false,
        canSetHomeAction: false,
        canTerritoryAction: false,
        combatDeathAvailable: false,
        combatStartAvailable: false,
        hexContentWindowShown: false,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat: vi.fn(),
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome: vi.fn(),
        onTerritoryAction: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect: vi.fn(),
        onSellAll: vi.fn(),
        onTogglePause: vi.fn(),
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot,
        windowShown: buildWindowShown(),
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

  it('toggles pause on a non-repeated Space press', async () => {
    const onTogglePause = vi.fn();

    function TestHarness() {
      useKeyboardShortcuts({
        canBulkProspectEquipment: false,
        canBulkSellEquipment: false,
        canSetHomeAction: false,
        canTerritoryAction: false,
        combatDeathAvailable: false,
        combatStartAvailable: false,
        hexContentWindowShown: false,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat: vi.fn(),
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome: vi.fn(),
        onTerritoryAction: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect: vi.fn(),
        onSellAll: vi.fn(),
        onTogglePause,
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot: vi.fn(),
        windowShown: buildWindowShown(),
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: ' ',
          code: 'Space',
        }),
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: ' ',
          code: 'Space',
          repeat: true,
        }),
      );
    });

    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('does not toggle pause or prevent default when Space targets a focusable button', async () => {
    const onTogglePause = vi.fn();
    let spaceEvent: KeyboardEvent | undefined;

    function TestHarness() {
      useKeyboardShortcuts({
        canBulkProspectEquipment: false,
        canBulkSellEquipment: false,
        canSetHomeAction: false,
        canTerritoryAction: false,
        combatDeathAvailable: false,
        combatStartAvailable: false,
        hexContentWindowShown: false,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat: vi.fn(),
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome: vi.fn(),
        onTerritoryAction: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect: vi.fn(),
        onSellAll: vi.fn(),
        onTogglePause,
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot: vi.fn(),
        windowShown: buildWindowShown(),
      });

      return <button type="button">Focusable control</button>;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    const button = host.querySelector('button') as HTMLButtonElement | null;
    expect(button).not.toBeNull();

    await act(async () => {
      button?.focus();
      spaceEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: ' ',
        code: 'Space',
      });
      button?.dispatchEvent(spaceEvent);
    });

    expect(onTogglePause).not.toHaveBeenCalled();
    expect(spaceEvent).toBeDefined();
    expect(spaceEvent?.defaultPrevented).toBe(false);
  });

  it('triggers the hex territory hotkey when the hex window can act', async () => {
    const onTerritoryAction = vi.fn();

    function TestHarness() {
      useKeyboardShortcuts({
        canBulkProspectEquipment: false,
        canBulkSellEquipment: false,
        canSetHomeAction: false,
        canTerritoryAction: true,
        combatDeathAvailable: false,
        combatStartAvailable: false,
        hexContentWindowShown: true,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat: vi.fn(),
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome: vi.fn(),
        onTerritoryAction,
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect: vi.fn(),
        onSellAll: vi.fn(),
        onTogglePause: vi.fn(),
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot: vi.fn(),
        windowShown: buildWindowShown(true),
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'a' }),
      );
    });

    expect(onTerritoryAction).toHaveBeenCalledTimes(1);
  });

  it('triggers the home hotkey when the hex window can set home', async () => {
    const onSetHome = vi.fn();

    function TestHarness() {
      useKeyboardShortcuts({
        canBulkProspectEquipment: false,
        canBulkSellEquipment: false,
        canSetHomeAction: true,
        canTerritoryAction: false,
        combatDeathAvailable: false,
        combatStartAvailable: false,
        hexContentWindowShown: true,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat: vi.fn(),
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome,
        onTerritoryAction: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect: vi.fn(),
        onSellAll: vi.fn(),
        onTogglePause: vi.fn(),
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot: vi.fn(),
        windowShown: buildWindowShown(true),
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'o' }),
      );
    });

    expect(onSetHome).toHaveBeenCalledTimes(1);
  });

  it('triggers bulk prospect on Q when the forge action is available', async () => {
    const onProspect = vi.fn();

    function TestHarness() {
      useKeyboardShortcuts({
        canBulkProspectEquipment: true,
        canBulkSellEquipment: false,
        canSetHomeAction: false,
        canTerritoryAction: false,
        combatDeathAvailable: false,
        combatStartAvailable: false,
        hexContentWindowShown: true,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat: vi.fn(),
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome: vi.fn(),
        onTerritoryAction: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect,
        onSellAll: vi.fn(),
        onTogglePause: vi.fn(),
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot: vi.fn(),
        windowShown: buildWindowShown(true),
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'q' }),
      );
    });

    expect(onProspect).toHaveBeenCalledTimes(1);
  });

  it('triggers bulk sell on Q when the town action is available', async () => {
    const onSellAll = vi.fn();

    function TestHarness() {
      useKeyboardShortcuts({
        canBulkProspectEquipment: false,
        canBulkSellEquipment: true,
        canSetHomeAction: false,
        canTerritoryAction: false,
        combatDeathAvailable: false,
        combatStartAvailable: false,
        hexContentWindowShown: true,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat: vi.fn(),
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome: vi.fn(),
        onTerritoryAction: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect: vi.fn(),
        onSellAll,
        onTogglePause: vi.fn(),
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot: vi.fn(),
        windowShown: buildWindowShown(true),
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'q' }),
      );
    });

    expect(onSellAll).toHaveBeenCalledTimes(1);
  });

  it('triggers the combat death hotkey when a long battle can be forfeited', async () => {
    const onForfeitCombat = vi.fn();

    function TestHarness() {
      useKeyboardShortcuts({
        canBulkProspectEquipment: false,
        canBulkSellEquipment: false,
        canSetHomeAction: false,
        canTerritoryAction: false,
        combatDeathAvailable: true,
        combatStartAvailable: false,
        hexContentWindowShown: true,
        interactLabel: null,
        lootSnapshotLength: 0,
        onForfeitCombat,
        onStartCombat: vi.fn(),
        onInteract: vi.fn(),
        onSetHome: vi.fn(),
        onTerritoryAction: vi.fn(),
        onTakeAllLoot: vi.fn(),
        onCloseAllWindows: vi.fn(),
        onProspect: vi.fn(),
        onSellAll: vi.fn(),
        onTogglePause: vi.fn(),
        onToggleDockWindow: vi.fn(),
        onUseActionBarSlot: vi.fn(),
        windowShown: buildWindowShown(true),
      });

      return null;
    }

    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 't' }),
      );
    });

    expect(onForfeitCombat).toHaveBeenCalledTimes(1);
  });
});
