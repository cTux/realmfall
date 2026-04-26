import {
  DEFAULT_WORLD_MAP_CAMERA,
  mapWorldMapScreenPointToScenePoint,
  zoomWorldMapCameraAtPoint,
} from './worldMapCamera';

describe('worldMapCamera', () => {
  it('maps screen points back into scene points after pan and zoom', () => {
    const scenePoint = mapWorldMapScreenPointToScenePoint(
      { x: 560, y: 330 },
      { width: 800, height: 600 },
      { zoom: 2, panX: 40, panY: -30 },
    );

    expect(scenePoint).toEqual({ x: 460, y: 330 });
  });

  it('keeps the anchored point stable while zooming', () => {
    const screen = { width: 800, height: 600 };
    const anchorPoint = { x: 520, y: 240 };
    const scenePointBeforeZoom = mapWorldMapScreenPointToScenePoint(
      anchorPoint,
      screen,
      DEFAULT_WORLD_MAP_CAMERA,
    );

    const zoomedCamera = zoomWorldMapCameraAtPoint(
      DEFAULT_WORLD_MAP_CAMERA,
      1.8,
      anchorPoint,
      screen,
    );
    const scenePointAfterZoom = mapWorldMapScreenPointToScenePoint(
      anchorPoint,
      screen,
      zoomedCamera,
    );

    expect(scenePointAfterZoom).toEqual(scenePointBeforeZoom);
  });
});
