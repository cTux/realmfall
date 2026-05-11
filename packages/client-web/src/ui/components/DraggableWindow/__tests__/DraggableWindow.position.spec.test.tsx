import { vi } from 'vitest';
import { DraggableWindowTestkit } from './DraggableWindowTestkit';

describe('DraggableWindow positioning', () => {
  let testkit: DraggableWindowTestkit;

  beforeEach(() => {
    testkit = new DraggableWindowTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('resets a newly opened off-viewport window to the top-left safe corner', async () => {
    const onMove = vi.fn();

    await testkit.actions.renderWindow({
      title: 'Offscreen',
      position: { x: 180, y: 120, width: 320, height: 220 },
      onMove,
      children: <div>Content</div>,
    });

    await testkit.expect.onMoveCalledWith(onMove, {
      x: 8,
      y: 8,
      width: 320,
      height: 220,
    });
  });

  it('keeps an opened window in place when it already fits inside the viewport', async () => {
    const onMove = vi.fn();

    await testkit.actions.renderWindow({
      title: 'Onscreen',
      position: { x: 40, y: 32, width: 220, height: 160 },
      onMove,
      children: <div>Content</div>,
    });

    await testkit.expect.closeButtonSmallWithIcon('Onscreen');
    await testkit.expect.onMoveNotCalled(onMove);
  });

  it('commits resized dimensions only after the resize interaction ends', async () => {
    const onMove = vi.fn();

    await testkit.actions.renderWindow({
      title: 'Resizable',
      position: { x: 40, y: 32, width: 220, height: 160 },
      resizeBounds: { minWidth: 180, minHeight: 120 },
      onMove,
      children: <div>Content</div>,
    });

    await testkit.actions.pointerDownResizeHandle('Resizable', 260, 192);
    await testkit.actions.pointerMove(320, 252);
    await testkit.expect.onMoveNotCalled(onMove);

    await testkit.actions.pointerUp();
    await testkit.expect.onMoveCalledWith(onMove, {
      x: 40,
      y: 32,
      width: 280,
      height: 220,
    });
  });
});
