import { describe, expect, it } from 'vitest';
import { matchesActivePointer } from './pixiWorldInteractionShared';
import { shouldIgnoreWorldMapWheelGesture } from './pixiWorldMapZoom';

describe('pixi world interaction helper modules', () => {
  it('keeps pointer identity matching in the shared interaction helper', () => {
    expect(matchesActivePointer(null, { pointerId: 3 })).toBe(true);
    expect(matchesActivePointer(3, { pointerId: 3 })).toBe(true);
    expect(matchesActivePointer(3, { pointerId: 4 })).toBe(false);
    expect(matchesActivePointer(3, {})).toBe(true);
  });

  it('keeps wheel-gesture filtering in the zoom helper', () => {
    expect(
      shouldIgnoreWorldMapWheelGesture({
        deltaX: 120,
        deltaY: 0,
      }),
    ).toBe(true);
    expect(
      shouldIgnoreWorldMapWheelGesture({
        deltaX: 60,
        deltaY: 30,
      }),
    ).toBe(true);
    expect(
      shouldIgnoreWorldMapWheelGesture({
        deltaX: 10,
        deltaY: 40,
      }),
    ).toBe(false);
  });
});
