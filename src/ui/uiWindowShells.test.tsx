import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { DEFAULT_WINDOWS } from '../app/constants';
import { GameTag } from '../game/content/tags';
import { createGame, getPlayerStats, type Item } from '../game/state';
import { Skill } from '../game/types';
import { DraggableWindow } from './components/DraggableWindow';
import { EquipmentWindow } from './components/EquipmentWindow';
import { HeroWindow } from './components/HeroWindow';
import { ItemContextMenu } from './components/ItemContextMenu';
import { LootWindow } from './components/LootWindow';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { SkillsWindow } from './components/SkillsWindow';

describe('ui window shells and interactions', () => {
  const renderMarkup = async (node: React.ReactNode) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(node);
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const markup = host.innerHTML;

    await act(async () => {
      root.unmount();
    });
    host.remove();

    return markup;
  };

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('raises hovered and active windows during interactions', async () => {
    vi.useFakeTimers();

    const moves: Array<{ x: number; y: number }> = [];
    const closeWindow = vi.fn();
    const close = vi.fn();
    const equip = vi.fn();
    const use = vi.fn();
    const drop = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    const menuItem: Item = {
      id: 'starter-ration',
      name: 'Trail Ration',
      quantity: 2,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 8,
      hunger: 12,
    };

    await act(async () => {
      root?.render(
        <>
          <DraggableWindow
            title="Background Window"
            position={{ x: 12, y: 18 }}
            onMove={() => {}}
          >
            <button type="button">Background action</button>
          </DraggableWindow>
          <DraggableWindow
            title="Test Window"
            position={{ x: 40, y: 50 }}
            onMove={(position) => moves.push(position)}
            onClose={closeWindow}
          >
            <div>Body</div>
          </DraggableWindow>
          <ItemContextMenu
            item={menuItem}
            x={100}
            y={120}
            equipLabel="Equip now"
            canEquip
            canUse
            onEquip={equip}
            onUse={use}
            onDrop={drop}
            onClose={close}
          />
        </>,
      );
    });

    const floatingWindows = Array.from(
      host.querySelectorAll('section[class*="floatingWindow"]'),
    );
    expect(floatingWindows).toHaveLength(2);

    const backgroundWindow = floatingWindows[0] as HTMLElement;
    const testWindow = floatingWindows[1] as HTMLElement;

    expect(testWindow.dataset.windowEmphasis).toBe('idle');

    await act(async () => {
      testWindow.dispatchEvent(
        new MouseEvent('pointerover', {
          bubbles: true,
          clientX: 80,
          clientY: 90,
        }),
      );
    });
    expect(testWindow.dataset.windowEmphasis).toBe('hovered');

    await act(async () => {
      backgroundWindow.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 20,
          clientY: 24,
        }),
      );
    });
    expect(backgroundWindow.dataset.windowEmphasis).toBe('active');
    close.mockClear();

    const header = testWindow.querySelector('div[class*="windowHeader"]');
    expect(header).not.toBeNull();
    await act(async () => {
      header?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 80,
          clientY: 100,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 5,
          clientY: 6,
        }),
      );
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves[moves.length - 1]).toEqual({ x: 8, y: 8 });
    expect(testWindow.dataset.windowEmphasis).toBe('active');
    expect(backgroundWindow.dataset.windowEmphasis).toBe('idle');

    const closeButton = testWindow.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement | null;
    expect(testWindow.textContent).toContain('Body');
    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(testWindow.textContent).toContain('Body');
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(host.textContent).not.toContain('Body');
    expect(closeWindow).toHaveBeenCalledTimes(1);

    const menuButtons = Array.from(host.querySelectorAll('button'));
    await act(async () => {
      menuButtons.find((button) => button.textContent === 'Equip now')?.click();
      menuButtons.find((button) => button.textContent === 'Use')?.click();
      menuButtons
        .find((button) => button.textContent?.startsWith('Drop'))
        ?.click();
    });
    expect(equip).toHaveBeenCalled();
    expect(use).toHaveBeenCalled();
    expect(drop).toHaveBeenCalled();

    await act(async () => {
      document.body.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      );
    });
    expect(close).toHaveBeenCalledTimes(3);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('renders lock and recipe actions in the item context menu when available', async () => {
    const markup = await renderMarkup(
      <ItemContextMenu
        item={{
          id: 'iron-chunks',
          itemKey: 'iron-chunks',
          name: 'Iron Chunks',
          tags: [GameTag.ItemResource, GameTag.ItemCraftingMaterial],
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
          locked: true,
        }}
        x={100}
        y={120}
        canEquip={false}
        canUse={false}
        canToggleLock
        isLocked
        canShowRecipes
        canProspectItem
        canSellEntry
        onEquip={() => {}}
        onUse={() => {}}
        onDrop={() => {}}
        onToggleLock={() => {}}
        onShowRecipes={() => {}}
        onProspect={() => {}}
        onSell={() => {}}
        onClose={() => {}}
      />,
    );

    expect(markup).toContain('Unlock');
    expect(markup).toContain('Show recipes');
    expect(markup).toContain('Prospect');
    expect(markup).toContain('Sell');
  });

  it('commits draggable window movement on pointer release', async () => {
    const moves: Array<{ x: number; y: number }> = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Batched Window"
          position={{ x: 40, y: 50 }}
          onMove={(position) => moves.push(position)}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    const header = host.querySelector(
      'div[class*="windowHeader"]',
    ) as HTMLDivElement | null;
    expect(header).not.toBeNull();

    await act(async () => {
      header?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 80,
          clientY: 100,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 100,
          clientY: 120,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 140,
          clientY: 160,
        }),
      );
    });

    expect(moves).toHaveLength(0);

    await act(async () => {
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves).toEqual([{ x: 100, y: 110 }]);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('skips draggable window movement commit when no drag delta occurred', async () => {
    const moves: Array<{ x: number; y: number }> = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Batched Window"
          position={{ x: 40, y: 50 }}
          onMove={(position) => moves.push(position)}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    const header = host.querySelector(
      'div[class*="windowHeader"]',
    ) as HTMLDivElement | null;
    expect(header).not.toBeNull();

    await act(async () => {
      header?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 80,
          clientY: 100,
        }),
      );
    });

    await act(async () => {
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves).toEqual([]);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('focuses a window when it becomes visible', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Focus Window"
          position={{ x: 40, y: 50 }}
          onMove={() => {}}
          visible={false}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    expect(host.querySelector('section[class*="floatingWindow"]')).toBeNull();

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Focus Window"
          position={{ x: 40, y: 50 }}
          onMove={() => {}}
          visible
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    await act(async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    });

    const windowElement = host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    expect(windowElement).not.toBeNull();
    expect(windowElement?.dataset.windowEmphasis).toBe('active');
    expect(document.activeElement).toBe(windowElement);

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('resizes draggable windows through the shared resize handle', async () => {
    const moves: Array<{
      x: number;
      y: number;
      width?: number;
      height?: number;
    }> = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(
        <DraggableWindow
          title="Resizable Window"
          position={{ x: 40, y: 50, width: 320, height: 240 }}
          onMove={(position) => moves.push(position)}
          resizeBounds={{ minWidth: 280, minHeight: 200 }}
        >
          <div>Body</div>
        </DraggableWindow>,
      );
    });

    const windowElement = host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    const resizeHandle = host.querySelector(
      'div[class*="resizeHandle"]',
    ) as HTMLDivElement | null;

    expect(windowElement).not.toBeNull();
    expect(resizeHandle).not.toBeNull();

    vi.spyOn(windowElement!, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 50,
      top: 50,
      left: 40,
      bottom: 290,
      right: 360,
      width: 320,
      height: 240,
      toJSON: () => ({}),
    });

    await act(async () => {
      resizeHandle?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 360,
          clientY: 290,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 420,
          clientY: 340,
        }),
      );
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves[moves.length - 1]).toEqual({
      x: 40,
      y: 50,
      width: 380,
      height: 290,
    });

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });

  it('forwards close-button tooltip handlers through shared window shells', async () => {
    const hoverDetail = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'window-tooltip-forwarding');
    const stats = getPlayerStats(game.player);

    await act(async () => {
      root.render(
        <>
          <HeroWindow
            position={DEFAULT_WINDOWS.hero}
            onMove={() => {}}
            stats={{
              ...stats,
              rawAttack: stats.attack,
              rawDefense: stats.defense,
              buffs: [],
              debuffs: [],
              abilityIds: ['kick'],
            }}
            hunger={50}
            onHoverDetail={hoverDetail}
          />
          <RecipeBookWindow
            position={DEFAULT_WINDOWS.recipes}
            onMove={() => {}}
            currentStructure="camp"
            recipes={[]}
            recipeSkillLevels={{
              [Skill.Gathering]: 1,
              [Skill.Logging]: 1,
              [Skill.Mining]: 1,
              [Skill.Skinning]: 1,
              [Skill.Fishing]: 1,
              [Skill.Cooking]: 1,
              [Skill.Smelting]: 1,
              [Skill.Crafting]: 1,
            }}
            inventoryCountsByItemKey={{}}
            materialFilterItemKey={null}
            onResetMaterialFilter={() => {}}
            onCraft={() => {}}
            onHoverDetail={hoverDetail}
          />
          <EquipmentWindow
            position={DEFAULT_WINDOWS.equipment}
            onMove={() => {}}
            equipment={game.player.equipment}
            onHoverItem={() => {}}
            onLeaveItem={() => {}}
            onUnequip={() => {}}
            onContextItem={() => {}}
            onHoverDetail={hoverDetail}
          />
        </>,
      );
    });

    const closeButtons = Array.from(
      host.querySelectorAll('button[aria-label="Close"]'),
    );

    expect(closeButtons).toHaveLength(3);

    await act(async () => {
      closeButtons.forEach((button) => {
        button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      });
    });

    expect(hoverDetail).toHaveBeenCalledTimes(3);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('shows custom tooltips for empty equipment slots', async () => {
    const hoverDetail = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'empty-slot-tooltip');

    await act(async () => {
      root.render(
        <EquipmentWindow
          position={DEFAULT_WINDOWS.equipment}
          onMove={() => {}}
          equipment={game.player.equipment}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
          onUnequip={() => {}}
          onContextItem={() => {}}
          onHoverDetail={hoverDetail}
          onLeaveDetail={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const emptyButtons = Array.from(host.querySelectorAll('button')).filter(
      (button) => button.getAttribute('aria-label') === 'Weapon empty',
    );
    expect(emptyButtons).toHaveLength(1);

    await act(async () => {
      emptyButtons[0]?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      'Weapon',
      [
        {
          kind: 'text',
          text: 'Equip weapon gear here.',
        },
      ],
      'rgba(148, 163, 184, 0.9)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('uses PascalCase skill labels for profession tooltip titles', async () => {
    const hoverDetail = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'skills-tooltip-title');
    const stats = getPlayerStats(game.player);

    await act(async () => {
      root.render(
        <SkillsWindow
          position={DEFAULT_WINDOWS.skills}
          onMove={() => {}}
          skills={stats.skills}
          onHoverDetail={hoverDetail}
          onLeaveDetail={() => {}}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const craftingRow = Array.from(
      host.querySelectorAll('div[class*="skillRow"]'),
    ).find((row) => row.textContent?.includes('crafting'));
    expect(craftingRow).not.toBeUndefined();

    await act(async () => {
      craftingRow?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      'Crafting',
      expect.any(Array),
      'rgba(56, 189, 248, 0.9)',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders the loot window with the shared resize handle', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const game = createGame(2, 'loot-window-resize');

    await act(async () => {
      root.render(
        <LootWindow
          position={{ ...DEFAULT_WINDOWS.loot, width: 320, height: 240 }}
          onMove={() => {}}
          loot={game.player.inventory}
          equipment={game.player.equipment}
          onClose={() => {}}
          onTakeAll={() => {}}
          onTakeItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />,
      );
    });

    expect(host.querySelector('div[class*="resizeHandle"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
