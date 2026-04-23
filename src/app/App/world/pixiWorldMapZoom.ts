import type { MutableRefObject } from 'react';
import type { Application, Container } from 'pixi.js';
import {
  applyWorldMapCameraToContainer,
  zoomWorldMapCameraAtPoint,
  type WorldMapCameraState,
} from '../../../ui/world/worldMapCamera';

export function shouldIgnoreWorldMapWheelGesture(
  event: Pick<WheelEvent, 'deltaX' | 'deltaY'>,
) {
  const absoluteDeltaX = Math.abs(event.deltaX);
  const absoluteDeltaY = Math.abs(event.deltaY);
  return absoluteDeltaY === 0 || absoluteDeltaX > absoluteDeltaY;
}

export function createWorldMapWheelHandler({
  app,
  canvas,
  getWorldMapContainer,
  scheduleCameraSave,
  worldMapCameraRef,
}: {
  app: Application;
  canvas: HTMLCanvasElement;
  getWorldMapContainer: () => Container;
  scheduleCameraSave: () => void;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
}) {
  return (event: WheelEvent) => {
    if (shouldIgnoreWorldMapWheelGesture(event)) {
      return;
    }

    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const nextCamera = zoomWorldMapCameraAtPoint(
      worldMapCameraRef.current,
      worldMapCameraRef.current.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1),
      {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
      app.screen,
    );
    if (nextCamera === worldMapCameraRef.current) {
      return;
    }

    worldMapCameraRef.current = nextCamera;
    applyWorldMapCameraToContainer(
      getWorldMapContainer(),
      app.screen,
      nextCamera,
    );
    scheduleCameraSave();
  };
}
