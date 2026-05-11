import React, { act } from 'react';
import { vi } from 'vitest';
import { DEFAULT_WINDOWS, type WindowPosition } from '../app/constants';
import { createGame } from '@realmfall/core/game/stateFactory';
import { DraggableWindow } from './components/DraggableWindow';
import { LootWindow } from './components/LootWindow';
import { mountUi, setupUiTestEnvironment } from './uiTestkit';

setupUiTestEnvironment();

describe('ui window resizing surfaces', () => {
  it('focuses a window when it becomes visible', async () => {
    const ui = await mountUi(
      <DraggableWindow
        title="Focus Window"
        position={{ x: 40, y: 50 }}
        onMove={() => {}}
        visible={false}
      >
        <div>Body</div>
      </DraggableWindow>,
    );

    expect(
      ui.host.querySelector('section[class*="floatingWindow"]'),
    ).toBeNull();

    await ui.render(
      <DraggableWindow
        title="Focus Window"
        position={{ x: 40, y: 50 }}
        onMove={() => {}}
        visible
      >
        <div>Body</div>
      </DraggableWindow>,
    );

    await act(async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    });

    const windowElement = ui.host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    expect(windowElement).not.toBeNull();
    expect(windowElement?.dataset.windowEmphasis).toBe('active');
    expect(document.activeElement).toBe(windowElement);

    await ui.unmount();
  });

  it('resizes draggable windows through the shared resize handle', async () => {
    const moves: Array<{
      x: number;
      y: number;
      width?: number;
      height?: number;
    }> = [];
    const ui = await mountUi(
      <DraggableWindow
        title="Resizable Window"
        position={{ x: 40, y: 50, width: 320, height: 240 }}
        onMove={(position: WindowPosition) => moves.push(position)}
        resizeBounds={{ minWidth: 280, minHeight: 200 }}
      >
        <div>Body</div>
      </DraggableWindow>,
    );

    const windowElement = ui.host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    const resizeHandle = ui.host.querySelector(
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

    await ui.unmount();
  });

  it('resizes draggable windows from scaled screen deltas without jumping', async () => {
    const moves: Array<{
      x: number;
      y: number;
      width?: number;
      height?: number;
    }> = [];
    const ui = await mountUi(
      <DraggableWindow
        title="Scaled Resizable Window"
        position={{ x: 40, y: 50, width: 320, height: 240 }}
        onMove={(position: WindowPosition) => moves.push(position)}
        resizeBounds={{ minWidth: 280, minHeight: 200 }}
      >
        <div>Body</div>
      </DraggableWindow>,
    );

    const windowElement = ui.host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    const resizeHandle = ui.host.querySelector(
      'div[class*="resizeHandle"]',
    ) as HTMLDivElement | null;

    expect(windowElement).not.toBeNull();
    expect(resizeHandle).not.toBeNull();

    windowElement?.style.setProperty('--app-ui-scale', '1.25');
    vi.spyOn(windowElement!, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 50,
      top: 50,
      left: 40,
      bottom: 350,
      right: 440,
      width: 400,
      height: 300,
      toJSON: () => ({}),
    });

    await act(async () => {
      resizeHandle?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 440,
          clientY: 350,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 500,
          clientY: 400,
        }),
      );
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });

    expect(moves[moves.length - 1]).toEqual({
      x: 40,
      y: 50,
      width: 368,
      height: 280,
    });

    await ui.unmount();
  });

  it('renders the loot window with the shared resize handle', async () => {
    const game = createGame(2, 'loot-window-resize');
    const ui = await mountUi(
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

    expect(ui.host.querySelector('div[class*="resizeHandle"]')).not.toBeNull();

    await ui.unmount();
  });
});
