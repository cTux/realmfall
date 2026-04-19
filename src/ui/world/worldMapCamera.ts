import type { Container } from 'pixi.js';

export interface WorldMapCameraState {
  zoom: number;
  panX: number;
  panY: number;
}

export const DEFAULT_WORLD_MAP_CAMERA: WorldMapCameraState = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

export const MIN_WORLD_MAP_ZOOM = 0.7;
export const MAX_WORLD_MAP_ZOOM = 2.5;

export function getWorldMapCameraCenter(screen: {
  width: number;
  height: number;
}) {
  return {
    x: screen.width / 2,
    y: screen.height / 2,
  };
}

export function clampWorldMapZoom(zoom: number) {
  return Math.max(MIN_WORLD_MAP_ZOOM, Math.min(MAX_WORLD_MAP_ZOOM, zoom));
}

export function applyWorldMapCameraToContainer(
  container: Container,
  screen: { width: number; height: number },
  camera: WorldMapCameraState,
) {
  const center = getWorldMapCameraCenter(screen);
  setPoint(container.pivot, center.x, center.y);
  setPoint(container.position, center.x + camera.panX, center.y + camera.panY);
  setScale(container.scale, camera.zoom);
}

export function mapWorldMapScreenPointToScenePoint(
  point: { x: number; y: number },
  screen: { width: number; height: number },
  camera: WorldMapCameraState,
) {
  const center = getWorldMapCameraCenter(screen);
  const translatedX = point.x - (center.x + camera.panX);
  const translatedY = point.y - (center.y + camera.panY);

  return {
    x: center.x + translatedX / camera.zoom,
    y: center.y + translatedY / camera.zoom,
  };
}

export function zoomWorldMapCameraAtPoint(
  camera: WorldMapCameraState,
  nextZoom: number,
  anchorPoint: { x: number; y: number },
  screen: { width: number; height: number },
) {
  const clampedZoom = clampWorldMapZoom(nextZoom);
  if (clampedZoom === camera.zoom) {
    return camera;
  }

  const center = getWorldMapCameraCenter(screen);
  const anchoredScenePoint = mapWorldMapScreenPointToScenePoint(
    anchorPoint,
    screen,
    camera,
  );

  return {
    zoom: clampedZoom,
    panX:
      anchorPoint.x -
      center.x -
      (anchoredScenePoint.x - center.x) * clampedZoom,
    panY:
      anchorPoint.y -
      center.y -
      (anchoredScenePoint.y - center.y) * clampedZoom,
  };
}

function setPoint(
  target:
    | {
        x?: number;
        y?: number;
        set?: (x: number, y: number) => void;
      }
    | undefined,
  x: number,
  y: number,
) {
  if (!target) {
    return;
  }

  if (typeof target.set === 'function') {
    target.set(x, y);
    return;
  }

  target.x = x;
  target.y = y;
}

function setScale(
  target:
    | {
        x?: number;
        y?: number;
        set?: (x: number, y?: number) => void;
      }
    | undefined,
  value: number,
) {
  if (!target) {
    return;
  }

  if (typeof target.set === 'function') {
    target.set(value, value);
    return;
  }

  target.x = value;
  target.y = value;
}
