import {
  mapWorldMapFishEyeDisplayPointToSourcePoint,
  mapWorldMapFishEyeSourcePointToDisplayPoint,
} from './worldMapFishEye';

describe('worldMapFishEye', () => {
  const screen = { width: 800, height: 600 };
  const center = { x: 400, y: 300 };

  it('pulls source sampling toward the center for displayed points inside the lens', () => {
    const displayPoint = { x: 520, y: 300 };
    const sourcePoint = mapWorldMapFishEyeDisplayPointToSourcePoint(
      displayPoint,
      screen,
      center,
    );

    expect(sourcePoint.x).toBeLessThan(displayPoint.x);
    expect(sourcePoint.y).toBe(displayPoint.y);
  });

  it('maps source points back out to their displayed position', () => {
    const sourcePoint = { x: 500, y: 300 };
    const displayPoint = mapWorldMapFishEyeSourcePointToDisplayPoint(
      sourcePoint,
      screen,
      center,
    );
    const remappedSource = mapWorldMapFishEyeDisplayPointToSourcePoint(
      displayPoint,
      screen,
      center,
    );

    expect(displayPoint.x).toBeGreaterThan(sourcePoint.x);
    expect(remappedSource.x).toBeCloseTo(sourcePoint.x, 3);
    expect(remappedSource.y).toBeCloseTo(sourcePoint.y, 3);
  });
});
