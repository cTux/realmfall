import { vi } from 'vitest';
import { DraggableWindowTestkit } from './DraggableWindowTestkit';

describe('DraggableWindow interaction', () => {
  let testkit: DraggableWindowTestkit;

  beforeEach(() => {
    testkit = new DraggableWindowTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('updates drag visuals through compositor position vars before commit', async () => {
    const onMove = vi.fn();
    await testkit.actions.renderWindow({
      title: 'Drag Visuals',
      position: { x: 40, y: 32, width: 220, height: 160 },
      onMove,
      children: <div>Content</div>,
    });

    await testkit.actions.pointerDownWindowHeader('Drag Visuals', 80, 100);
    await testkit.actions.pointerMove(140, 160);

    await testkit.expect.onMoveNotCalled(onMove);
    await testkit.expect.windowInteractingState('Drag Visuals', 'true');
    await testkit.expect.headerPositionForTitle(
      'Drag Visuals',
      '100px',
      '92px',
    );

    await testkit.actions.pointerUp();
    await testkit.expect.windowInteractingState('Drag Visuals', 'false');
  });

  it('brings reopened and reactivated windows to the front of their stack layer', async () => {
    await testkit.actions.renderWindows([
      {
        title: 'Background',
        position: { x: 40, y: 32, width: 220, height: 160 },
        onMove: () => {},
        visible: true,
        children: <div>Background content</div>,
      },
      {
        title: 'Foreground',
        position: { x: 72, y: 56, width: 220, height: 160 },
        onMove: () => {},
        visible: false,
        children: <div>Foreground content</div>,
      },
    ]);

    await testkit.expect.windowCount(1);

    await testkit.actions.renderWindows([
      {
        title: 'Background',
        position: { x: 40, y: 32, width: 220, height: 160 },
        onMove: () => {},
        visible: true,
        children: <div>Background content</div>,
      },
      {
        title: 'Foreground',
        position: { x: 72, y: 56, width: 220, height: 160 },
        onMove: () => {},
        visible: true,
        children: <div>Foreground content</div>,
      },
    ]);

    await testkit.expect.windowCount(2);
    await testkit.expect.zIndexHigherThan(
      'Foreground content',
      'Background content',
    );

    await testkit.actions.pointerDownWindowHeader('Background content', 60, 48);
    await testkit.expect.zIndexHigherThan(
      'Background content',
      'Foreground content',
    );
  });
});
