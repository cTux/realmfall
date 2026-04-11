import {
  formatWorldTime,
  GAME_DAY_DURATION_MS,
  getTimeOfDayLighting,
  getWorldTimeMinutesFromTimestamp,
} from './timeOfDay';

describe('timeOfDay', () => {
  it('maps timestamps into a continuous 24-hour clock for a one-hour day', () => {
    expect(getWorldTimeMinutesFromTimestamp(0)).toBe(0);
    expect(getWorldTimeMinutesFromTimestamp(GAME_DAY_DURATION_MS / 2)).toBe(
      720,
    );
    expect(
      getWorldTimeMinutesFromTimestamp(GAME_DAY_DURATION_MS - 1),
    ).toBeCloseTo(1439.976, 3);
  });

  it('formats world times as zero-padded hours and minutes', () => {
    expect(formatWorldTime(0)).toBe('00:00');
    expect(formatWorldTime(61)).toBe('01:01');
    expect(formatWorldTime(1439)).toBe('23:59');
  });

  it('brightens the world during the day and darkens it at night', () => {
    const noon = getTimeOfDayLighting(12 * 60);
    const midnight = getTimeOfDayLighting(0);

    expect(noon.celestialBody).toBe('sun');
    expect(midnight.celestialBody).toBe('moon');
    expect(noon.ambientBrightness).toBeGreaterThan(midnight.ambientBrightness);
    expect(noon.shaftAlpha).toBeGreaterThan(midnight.shaftAlpha);
    expect(noon.overlayAlpha).toBeLessThan(midnight.overlayAlpha);
  });
});
