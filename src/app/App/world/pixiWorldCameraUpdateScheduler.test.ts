import type { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { createWorldMapCameraUpdateScheduler } from './pixiWorldCameraUpdateScheduler';

function createContainer() {
  return {
    pivot: { set: vi.fn() },
    position: { set: vi.fn() },
    scale: { set: vi.fn() },
  } as unknown as Container;
}

function createFrameControls() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextFrameId = 1;
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    const frameId = nextFrameId;
    nextFrameId += 1;
    callbacks.set(frameId, callback);
    return frameId;
  });
  const cancelFrame = vi.fn((frameId: number) => {
    callbacks.delete(frameId);
  });

  return {
    callbacks,
    cancelFrame,
    requestFrame,
    runFrame: (frameId: number) => callbacks.get(frameId)?.(0),
  };
}

describe('pixiWorldCameraUpdateScheduler', () => {
  it('coalesces multiple camera updates into one frame write', () => {
    const container = createContainer();
    const frameControls = createFrameControls();
    const scheduler = createWorldMapCameraUpdateScheduler({
      getWorldMapContainer: () => container,
      screen: { width: 800, height: 600 },
      requestFrame: frameControls.requestFrame,
      cancelFrame: frameControls.cancelFrame,
    });

    scheduler.queue({ zoom: 1.25, panX: 10, panY: 20 });
    scheduler.queue({ zoom: 2, panX: 30, panY: 40 });

    expect(frameControls.requestFrame).toHaveBeenCalledTimes(1);
    expect(container.position.set).not.toHaveBeenCalled();

    frameControls.runFrame(1);

    expect(container.pivot.set).toHaveBeenCalledWith(400, 300);
    expect(container.position.set).toHaveBeenCalledWith(430, 340);
    expect(container.scale.set).toHaveBeenCalledWith(2, 2);
  });

  it('cancels queued camera writes on dispose', () => {
    const container = createContainer();
    const frameControls = createFrameControls();
    const scheduler = createWorldMapCameraUpdateScheduler({
      getWorldMapContainer: () => container,
      screen: { width: 800, height: 600 },
      requestFrame: frameControls.requestFrame,
      cancelFrame: frameControls.cancelFrame,
    });

    scheduler.queue({ zoom: 2, panX: 30, panY: 40 });
    scheduler.dispose();
    frameControls.runFrame(1);

    expect(frameControls.cancelFrame).toHaveBeenCalledWith(1);
    expect(container.position.set).not.toHaveBeenCalled();
  });
});
