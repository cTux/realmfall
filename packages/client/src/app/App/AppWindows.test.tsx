import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DEFAULT_WINDOWS, DEFAULT_WINDOW_VISIBILITY } from '../../app/constants';
import { AppWindows } from './AppWindows';
import { getDockEntries } from './utils/getDockEntries';
import type { AppWindowsProps } from './AppWindows.types';

let fixedWindowsRenderCount = 0;
let deferredWindowsRenderCount = 0;

vi.mock('./components/AppFixedWindows', () => ({
  AppFixedWindows: () => {
    fixedWindowsRenderCount += 1;
    return <div data-testid="app-fixed-windows" />;
  },
}));

vi.mock('./components/AppDeferredWindows', () => ({
  AppDeferredWindows: () => {
    deferredWindowsRenderCount += 1;
    return <div data-testid="app-deferred-windows" />;
  },
}));

vi.mock('./hooks/useAppWindowHandlers', () => ({
  useAppWindowHandlers: () => ({
    windowMoveHandlers: {},
    windowCloseHandlers: {},
  }),
}));

vi.mock('./hooks/useManagedWindowProps', () => ({
  useManagedWindowProps: () => ({}),
}));

vi.mock('./hooks/useHexInfoView', () => ({
  useHexInfoView: () => ({}),
}));

vi.mock('./hooks/useRecipeWindowStructure', () => ({
  useRecipeWindowStructure: () => ({}),
}));

vi.mock('./hooks/useCombatPlayerParty', () => ({
  useCombatPlayerParty: () => ({}),
}));

vi.mock('./hooks/useMountedWindows', () => ({
  useMountedWindows: () => ([]),
}));

vi.mock('./utils/getDockEntries', () => ({
  getDockEntries: vi.fn(() => []),
}));

vi.mock('./debugWindow', () => ({
  isDebugWindowRequested: () => false,
}));

function createProps(): AppWindowsProps {
  return {
    layout: {
      appReady: true,
      windows: DEFAULT_WINDOWS,
      windowShown: DEFAULT_WINDOW_VISIBILITY,
      keepLootWindowMounted: true,
      keepCombatWindowMounted: false,
      tooltipPositionRef: { current: null },
    },
    views: {
      hero: { overview: {}, hunger: 1, thirst: 1 },
      player: { coord: { q: 0, r: 0 }, mana: 10 },
      inventory: {
        actionBarSlots: [],
        level: 1,
        equipment: [],
        inventory: [],
        learnedRecipeIds: [],
      },
      hex: {
        homeHex: { q: 0, r: 0 },
        currentTile: { claim: null, items: [] },
        currentTileHostileEnemyCount: 0,
        combat: null,
        interactLabel: null,
        canBulkProspectEquipment: false,
        canBulkSellEquipment: false,
        itemModification: null,
        outpostBuildStatus: { canBuild: false, buildables: [], reason: null },
        claimStatus: null,
        territoryNpcHealStatus: { canHeal: false },
        bulkProspectEquipmentExplanation: null,
        bulkSellEquipmentExplanation: null,
        townStock: [],
        gold: 0,
      },
      recipes: {
        entries: [],
        skillLevels: {},
        inventoryCountsByItemKey: {},
        preferredSkill: null,
        materialFilterItemKey: null,
      },
      loot: {
        visible: false,
        snapshot: [],
      },
      combat: {
        visible: false,
        snapshot: null,
      },
      logs: {
        showFilterMenu: false,
        filters: {},
        filtered: [],
      },
      settings: {
        audio: {
          musicMuted: false,
          muted: false,
          respectReducedMotion: false,
          soundEffects: {
            click: true,
            error: true,
            hover: true,
            notify: true,
            pop: true,
            success: true,
            swoosh: true,
            toggle: true,
            warning: true,
          },
          musicVolume: 0.5,
          uiVolume: 0.5,
          voiceVolume: 0.5,
          theme: 'soft',
          voice: {
            actorId: 'seraphic',
            events: {
              combatAttack: true,
              combatEnd: true,
              combatExertion: true,
              playerDamaged: true,
              playerDeath: true,
            },
          },
        },
        gameplay: {},
        graphics: {
          fpsLimit: 60,
        },
        interface: {
          language: 'en',
          fontFamily: 'default',
          fontSize: 100,
          interfaceScale: 100,
          showTooltipTags: true,
          windowTransparency: 0,
        },
      },
      debug: {},
      itemMenu: null,
    },
    actions: {
      windows: {
        onMoveWindow: vi.fn(),
        onSetWindowVisibility: vi.fn(),
      },
      tooltip: {
        onCloseItemMenu: vi.fn(),
        onCloseTooltip: vi.fn(),
        onShowItemTooltip: vi.fn(),
        onShowTooltip: vi.fn(),
        onShowActionBarItemTooltip: vi.fn(),
        onEquipmentHover: vi.fn(),
      },
      debug: {},
      combat: {
        onForfeitCombat: vi.fn(),
      },
      settings: {
        onSaveSettings: vi.fn(),
        onSaveSettingsAndReload: vi.fn(),
        onSetUiAudioSettings: vi.fn(),
      },
      inventory: {
        onActivateInventoryItem: vi.fn(),
        onAssignActionBarSlot: vi.fn(),
        onContextItem: vi.fn(),
        onEquipItem: vi.fn(),
        onSetItemLocked: vi.fn(),
        onUnequip: vi.fn(),
      },
      recipes: {
        onOpenWithMaterialFilter: vi.fn(),
      },
      hex: {
        onBuyTownItem: vi.fn(),
        onBuildOutpost: vi.fn(),
        onClaimHex: vi.fn(),
        onHealTerritoryNpc: vi.fn(),
        onSetHome: vi.fn(),
        onToggleItemModificationPicker: vi.fn(),
        onInteract: vi.fn(),
        onProspect: vi.fn(),
      },
      logs: {
        onToggleFilterMenu: vi.fn(),
        onToggleLogFilter: vi.fn(),
      },
    },
  } as unknown as AppWindowsProps;
}

describe('AppWindows', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    fixedWindowsRenderCount = 0;
    deferredWindowsRenderCount = 0;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    vi.clearAllMocks();
  });

  it('keeps render count stable when props are unchanged', async () => {
    const props = createProps();
    const spy = vi.mocked(getDockEntries);

    await act(async () => {
      root.render(<AppWindows {...props} />);
    });

    expect(fixedWindowsRenderCount).toBe(1);
    expect(deferredWindowsRenderCount).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.render(<AppWindows {...props} />);
    });

    expect(fixedWindowsRenderCount).toBe(1);
    expect(deferredWindowsRenderCount).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
