import React, { act } from 'react';
import { vi } from 'vitest';
import type { Item } from '../game/stateTypes';
import { DraggableWindow } from './components/DraggableWindow';
import { ItemContextMenu } from './components/ItemContextMenu';
import { mountUi, setupUiTestEnvironment } from './uiTestHelpers';
import type { WindowPosition } from '../app/constants';

setupUiTestEnvironment();

describe('ui window interactions', () => {
  it('raises hovered and active windows during interactions', async () => {
    vi.useFakeTimers();

    const moves: Array<{ x: number; y: number }> = [];
    const closeWindow = vi.fn();
    const close = vi.fn();
    const equip = vi.fn();
    const use = vi.fn();
    const drop = vi.fn();
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

    const ui = await mountUi(
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
          onMove={(position: WindowPosition) => moves.push(position)}
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

    const floatingWindows = Array.from(
      ui.host.querySelectorAll('section[class*="floatingWindow"]'),
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
    expect(ui.host.textContent).not.toContain('Body');
    expect(closeWindow).toHaveBeenCalledTimes(1);

    const menuButtons = Array.from(ui.host.querySelectorAll('button'));
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

    await ui.unmount();
  });

  it('commits draggable window movement on pointer release', async () => {
    const moves: Array<{ x: number; y: number }> = [];
    const ui = await mountUi(
        <DraggableWindow
        title="Batched Window"
        position={{ x: 40, y: 50 }}
        onMove={(position: WindowPosition) => moves.push(position)}
      >
        <div>Body</div>
      </DraggableWindow>,
    );

    const header = ui.host.querySelector(
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

    await ui.unmount();
  });

  it('skips draggable window movement commit when no drag delta occurred', async () => {
    const moves: Array<{ x: number; y: number }> = [];
    const ui = await mountUi(
        <DraggableWindow
          title="Batched Window"
          position={{ x: 40, y: 50 }}
          onMove={(position: WindowPosition) => moves.push(position)}
        >
        <div>Body</div>
      </DraggableWindow>,
    );

    const header = ui.host.querySelector(
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

    await ui.unmount();
  });
});
