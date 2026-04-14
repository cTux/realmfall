import {
  formatWorldCalendarDateTime,
  formatWorldDateTime,
  formatWorldTime,
  GAME_DAY_DURATION_MS,
  getWorldDayFromTimestamp,
  isDaylight,
  isMoonRising,
  parseWorldCalendarDateTime,
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
    ).toBeCloseTo(1440 - 1440 / GAME_DAY_DURATION_MS, 3);
  });

  it('formats world times as zero-padded hours and minutes', () => {
    expect(formatWorldTime(0)).toBe('00:00');
    expect(formatWorldTime(61)).toBe('01:01');
    expect(formatWorldTime(1439)).toBe('23:59');
  });

  it('tracks the current world day from elapsed time', () => {
    expect(getWorldDayFromTimestamp(0)).toBe(1);
    expect(getWorldDayFromTimestamp(GAME_DAY_DURATION_MS - 1)).toBe(1);
    expect(getWorldDayFromTimestamp(GAME_DAY_DURATION_MS)).toBe(2);
  });

  it('formats world date-time labels with the day number', () => {
    expect(formatWorldDateTime(0)).toBe('Day 1, 00:00');
    expect(
      formatWorldDateTime(GAME_DAY_DURATION_MS + GAME_DAY_DURATION_MS / 2),
    ).toBe('Day 2, 12:00');
  });

  it('round-trips full calendar timestamps through the shared formatter', () => {
    const timestampMs =
      410 * GAME_DAY_DURATION_MS + (75 / 1440) * GAME_DAY_DURATION_MS;

    const formatted = formatWorldCalendarDateTime(timestampMs);

    expect(formatted).toBe('Year 2, Day 46, 01:15');
    expect(parseWorldCalendarDateTime(formatted)).toBeCloseTo(timestampMs, 3);
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

  it('crossfades sun and moon opacity through sunrise and sunset', () => {
    const dawn = getTimeOfDayLighting(6 * 60);
    const dusk = getTimeOfDayLighting(19 * 60);

    expect(dawn.sunOpacity).toBeGreaterThan(0);
    expect(dawn.moonOpacity).toBeGreaterThan(0);
    expect(dawn.sunOpacity).toBeLessThan(1);
    expect(dawn.moonOpacity).toBeLessThan(1);

    expect(dusk.sunOpacity).toBeGreaterThan(0);
    expect(dusk.moonOpacity).toBeGreaterThan(0);
    expect(dusk.sunOpacity).toBeLessThan(1);
    expect(dusk.moonOpacity).toBeLessThan(1);
    expect(dawn.sunShaftOpacity).toBeGreaterThan(0);
    expect(dawn.moonShaftOpacity).toBeGreaterThan(0);
    expect(dusk.sunShaftOpacity).toBeGreaterThan(0);
    expect(dusk.moonShaftOpacity).toBeGreaterThan(0);
  });

  it('tints the world red and tracks the blood moon rise window', () => {
    const normalNight = getTimeOfDayLighting(19 * 60);
    const bloodMoonNight = getTimeOfDayLighting(19 * 60, { bloodMoon: true });
    const midnight = getTimeOfDayLighting(0);

    expect(isMoonRising(19 * 60)).toBe(true);
    expect(isMoonRising(12 * 60)).toBe(false);
    expect(isDaylight(12 * 60)).toBe(true);
    expect(isDaylight(19 * 60)).toBe(false);
    expect(midnight.ambientBrightness).toBeGreaterThan(0.6);
    expect(midnight.moonShaftOpacity).toBeGreaterThan(0.65);
    expect(bloodMoonNight.skyColor).not.toBe(normalNight.skyColor);
    expect(bloodMoonNight.overlayAlpha).toBeGreaterThan(
      normalNight.overlayAlpha,
    );
    expect(bloodMoonNight.ambientBrightness).toBeGreaterThan(0.6);
    expect(bloodMoonNight.moonShaftOpacity).toBeGreaterThan(
      normalNight.moonShaftOpacity,
    );
    expect(bloodMoonNight.celestialTint).not.toBe(normalNight.celestialTint);
  });

  it('tints the world cyan during a harvest moon', () => {
    const normalNight = getTimeOfDayLighting(19 * 60);
    const harvestMoonNight = getTimeOfDayLighting(19 * 60, {
      harvestMoon: true,
    });

    expect(harvestMoonNight.skyColor).not.toBe(normalNight.skyColor);
    expect(harvestMoonNight.overlayAlpha).toBeGreaterThan(
      normalNight.overlayAlpha,
    );
    expect(harvestMoonNight.moonShaftOpacity).toBeGreaterThan(
      normalNight.moonShaftOpacity,
    );
    expect(harvestMoonNight.celestialTint).not.toBe(normalNight.celestialTint);
  });

  it('keeps sky transitions very smooth around keyframes', () => {
    const beforeSunrise = getTimeOfDayLighting(7 * 60 - 1);
    const atSunrise = getTimeOfDayLighting(7 * 60);
    const afterSunrise = getTimeOfDayLighting(7 * 60 + 1);

    expect(
      colorDistance(beforeSunrise.skyColor, atSunrise.skyColor),
    ).toBeLessThan(18);
    expect(
      colorDistance(atSunrise.skyColor, afterSunrise.skyColor),
    ).toBeLessThan(18);
    expect(
      Math.abs(beforeSunrise.ambientBrightness - atSunrise.ambientBrightness),
    ).toBeLessThan(0.03);
    expect(
      Math.abs(atSunrise.ambientBrightness - afterSunrise.ambientBrightness),
    ).toBeLessThan(0.03);
  });
});

function colorDistance(from: number, to: number) {
  const fromR = (from >> 16) & 0xff;
  const fromG = (from >> 8) & 0xff;
  const fromB = from & 0xff;
  const toR = (to >> 16) & 0xff;
  const toG = (to >> 8) & 0xff;
  const toB = to & 0xff;
  return Math.abs(fromR - toR) + Math.abs(fromG - toG) + Math.abs(fromB - toB);
}
