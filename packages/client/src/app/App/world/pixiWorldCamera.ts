import type { Application, Container } from 'pixi.js';
import type { MutableRefObject } from 'react';
import { mapWorldMapFishEyeDisplayPointToSourcePoint } from '../../../ui/world/worldMapFishEyeRuntime';
import {
  applyWorldMapCameraToContainer,
  mapWorldMapScreenPointToScenePoint,
  type WorldMapCameraState,
} from '../../../ui/world/worldMapCamera';
import {
  getGraphicsRenderResolution,
  type GraphicsResolutionCap,
} from '../../graphicsSettings';
import {
  loadWorldMapSettings,
  saveWorldMapSettings,
  worldMapCameraToSettings,
  worldMapSettingsToCamera,
} from '../../worldMapSettings';

export type WorldScenePointMapper = (
  clientX: number,
  clientY: number,
) => { x: number; y: number };

export function loadSavedWorldMapCamera(
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>,
) {
  worldMapCameraRef.current = worldMapSettingsToCamera(loadWorldMapSettings());
}

export function createWorldResizeHandler({
  app,
  hostRef,
  resolutionCap,
  worldMapCameraRef,
  getWorldMapContainer,
}: {
  app: Application;
  hostRef: MutableRefObject<HTMLDivElement | null>;
  resolutionCap: GraphicsResolutionCap;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
  getWorldMapContainer: () => Container;
}) {
  return () => {
    const width = hostRef.current?.clientWidth ?? window.innerWidth;
    const height = hostRef.current?.clientHeight ?? window.innerHeight;
    const resolution = getGraphicsRenderResolution(
      { resolutionCap },
      window.devicePixelRatio,
    );
    if (app.renderer.resolution !== resolution) {
      app.renderer.resolution = resolution;
    }
    app.renderer.resize(width, height);
    applyWorldMapCameraToContainer(
      getWorldMapContainer(),
      app.screen,
      worldMapCameraRef.current,
    );
  };
}

export function createWorldScenePointMapper({
  app,
  canvas,
  worldMapCameraRef,
}: {
  app: Application;
  canvas: HTMLCanvasElement;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
}): WorldScenePointMapper {
  const getSourcePoint = (displayPoint: { x: number; y: number }) =>
    mapWorldMapFishEyeDisplayPointToSourcePoint(displayPoint, app.screen, {
      x: app.screen.width / 2,
      y: app.screen.height / 2,
    });

  return (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const sourcePoint = getSourcePoint({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });

    return mapWorldMapScreenPointToScenePoint(
      sourcePoint,
      app.screen,
      worldMapCameraRef.current,
    );
  };
}

export function createWorldCameraSaveScheduler({
  cameraSaveTimerRef,
  worldMapCameraRef,
}: {
  cameraSaveTimerRef: MutableRefObject<number | null>;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
}) {
  return () => {
    if (cameraSaveTimerRef.current !== null) {
      window.clearTimeout(cameraSaveTimerRef.current);
    }

    cameraSaveTimerRef.current = window.setTimeout(() => {
      cameraSaveTimerRef.current = null;
      saveWorldMapSettings(worldMapCameraToSettings(worldMapCameraRef.current));
    }, 300);
  };
}
