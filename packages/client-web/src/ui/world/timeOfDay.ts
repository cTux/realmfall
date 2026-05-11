import {
  DAYLIGHT_START,
  WORLD_CALENDAR_DAYS_PER_YEAR,
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
  MOONRISE_END,
  MOONRISE_START,
  SUNRISE_START,
} from '@realmfall/core/game/config';
import {
  getWorldDayFromTimestamp,
  getWorldTimeMinutesFromTimestamp,
} from '@realmfall/core/game/worldTime';
import { t } from '../../i18n';
import {
  WORLD_EVENT_LIGHTING,
  WORLD_LIGHTING_KEYFRAMES,
  type LightingProfile,
} from '../../theme.config';

export {
  DAYLIGHT_START,
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
  getWorldDayFromTimestamp,
  getWorldTimeMinutesFromTimestamp,
  MOONRISE_END,
  MOONRISE_START,
};

interface TimeOfDayLighting {
  skyColor: number;
  overlayColor: number;
  overlayAlpha: number;
  ambientBrightness: number;
  shaftAlpha: number;
  celestialBody: 'sun' | 'moon';
  celestialTint: number;
  celestialAlpha: number;
  cloudAlphaBoost: number;
  sunOpacity: number;
  moonOpacity: number;
  sunShaftOpacity: number;
  moonShaftOpacity: number;
}

const SUNRISE_END = DAYLIGHT_START;
const SUNSET_START = MOONRISE_START;
const SUNSET_END = MOONRISE_END;

export function formatWorldTime(totalMinutes: number) {
  const normalizedMinutes =
    ((Math.floor(totalMinutes) % GAME_DAY_MINUTES) + GAME_DAY_MINUTES) %
    GAME_DAY_MINUTES;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

export function formatWorldDateTime(timestampMs: number) {
  return t('game.time.dayDateTime', {
    day: getWorldDayFromTimestamp(timestampMs),
    time: formatWorldTime(getWorldTimeMinutesFromTimestamp(timestampMs)),
  });
}

export function formatWorldCalendarDateTime(timestampMs: number) {
  const day = getWorldDayFromTimestamp(timestampMs);
  const year = Math.floor((day - 1) / WORLD_CALENDAR_DAYS_PER_YEAR) + 1;
  const dayOfYear = ((day - 1) % WORLD_CALENDAR_DAYS_PER_YEAR) + 1;
  return t('game.time.calendarDateTime', {
    year,
    day: dayOfYear,
    time: formatWorldTime(getWorldTimeMinutesFromTimestamp(timestampMs)),
  });
}

export function parseWorldCalendarDateTime(timestampLabel: string) {
  const match = timestampLabel.match(
    /^Year (\d+), Day (\d+), (\d{2}):(\d{2})$/,
  );
  if (!match) return null;

  const [, yearText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const day = Number(dayText);
  const hours = Number(hourText);
  const minutes = Number(minuteText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  const absoluteDay = (year - 1) * 365 + day;
  const totalMinutes = hours * 60 + minutes;
  const minuteOffsetMs =
    totalMinutes === 0
      ? 0
      : Math.ceil((totalMinutes * GAME_DAY_DURATION_MS) / GAME_DAY_MINUTES);

  return (absoluteDay - 1) * GAME_DAY_DURATION_MS + minuteOffsetMs;
}

export function getTimeOfDayLighting(
  totalMinutes: number,
  options?: { bloodMoon?: boolean; harvestMoon?: boolean },
): TimeOfDayLighting {
  const minutes =
    ((totalMinutes % GAME_DAY_MINUTES) + GAME_DAY_MINUTES) % GAME_DAY_MINUTES;
  const profile = sampleLightingProfile(minutes);
  const sunOpacity = getSunOpacity(minutes);
  const moonOpacity = getMoonOpacity(minutes);

  const lighting = {
    skyColor: profile.skyColor,
    overlayColor: profile.overlayColor,
    overlayAlpha: profile.overlayAlpha,
    ambientBrightness: profile.ambientBrightness,
    shaftAlpha: profile.shaftAlpha,
    celestialBody:
      sunOpacity >= moonOpacity ? ('sun' as const) : ('moon' as const),
    celestialTint: profile.celestialTint,
    celestialAlpha: profile.celestialAlpha,
    cloudAlphaBoost: profile.cloudAlphaBoost,
    sunOpacity,
    moonOpacity,
    sunShaftOpacity: sunOpacity * smoothLerp(0.35, 1, sunOpacity),
    moonShaftOpacity: moonOpacity * smoothLerp(0.3, 0.72, moonOpacity),
  };

  if (options?.bloodMoon) return applyBloodMoonLighting(lighting);
  if (options?.harvestMoon) return applyHarvestMoonLighting(lighting);
  return lighting;
}

export function isMoonRising(totalMinutes: number) {
  const minutes =
    ((totalMinutes % GAME_DAY_MINUTES) + GAME_DAY_MINUTES) % GAME_DAY_MINUTES;
  return minutes >= MOONRISE_START && minutes < MOONRISE_END;
}

export function isDaylight(totalMinutes: number) {
  const minutes =
    ((totalMinutes % GAME_DAY_MINUTES) + GAME_DAY_MINUTES) % GAME_DAY_MINUTES;
  return minutes >= DAYLIGHT_START && minutes < MOONRISE_START;
}

function getSunOpacity(minutes: number) {
  if (minutes < SUNRISE_START || minutes >= SUNSET_END) return 0;
  if (minutes < SUNRISE_END) {
    return smoothstep(
      (minutes - SUNRISE_START) / (SUNRISE_END - SUNRISE_START),
    );
  }
  if (minutes < SUNSET_START) return 1;
  return 1 - smoothstep((minutes - SUNSET_START) / (SUNSET_END - SUNSET_START));
}

function getMoonOpacity(minutes: number) {
  if (minutes < SUNRISE_START) return 1;
  if (minutes < SUNRISE_END) {
    return (
      1 - smoothstep((minutes - SUNRISE_START) / (SUNRISE_END - SUNRISE_START))
    );
  }
  if (minutes < SUNSET_START) return 0;
  if (minutes < SUNSET_END) {
    return smoothstep((minutes - SUNSET_START) / (SUNSET_END - SUNSET_START));
  }
  return 1;
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * clamp(progress);
}

function smoothLerp(start: number, end: number, progress: number) {
  return lerp(start, end, smootherstep(progress));
}

function smoothstep(progress: number) {
  const amount = clamp(progress);
  return amount * amount * (3 - 2 * amount);
}

function smootherstep(progress: number) {
  const amount = clamp(progress);
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mixColor(from: number, to: number, progress: number) {
  const amount = clamp(progress);
  const fromRgb = unpackColor(from).map(toLinearChannel);
  const toRgb = unpackColor(to).map(toLinearChannel);

  const red = Math.round(
    toSrgbChannel(lerp(fromRgb[0] ?? 0, toRgb[0] ?? 0, amount)),
  );
  const green = Math.round(
    toSrgbChannel(lerp(fromRgb[1] ?? 0, toRgb[1] ?? 0, amount)),
  );
  const blue = Math.round(
    toSrgbChannel(lerp(fromRgb[2] ?? 0, toRgb[2] ?? 0, amount)),
  );

  return (red << 16) | (green << 8) | blue;
}

function sampleLightingProfile(minutes: number): LightingProfile {
  const upperIndex =
    WORLD_LIGHTING_KEYFRAMES.findIndex(
      (keyframe) => keyframe.minute > minutes,
    ) === -1
      ? 0
      : WORLD_LIGHTING_KEYFRAMES.findIndex(
          (keyframe) => keyframe.minute > minutes,
        );
  const lowerIndex =
    (upperIndex - 1 + WORLD_LIGHTING_KEYFRAMES.length) %
    WORLD_LIGHTING_KEYFRAMES.length;
  const previousIndex =
    (lowerIndex - 1 + WORLD_LIGHTING_KEYFRAMES.length) %
    WORLD_LIGHTING_KEYFRAMES.length;
  const nextIndex = (upperIndex + 1) % WORLD_LIGHTING_KEYFRAMES.length;
  const lowerMinute = WORLD_LIGHTING_KEYFRAMES[lowerIndex]?.minute ?? 0;
  const upperMinute = wrappedMinuteForIndex(upperIndex, lowerMinute);
  const progress = smootherstep(
    (minutes - lowerMinute) / Math.max(1, upperMinute - lowerMinute),
  );
  const previous =
    WORLD_LIGHTING_KEYFRAMES[previousIndex]?.profile ??
    WORLD_LIGHTING_KEYFRAMES[lowerIndex]!.profile;
  const lower = WORLD_LIGHTING_KEYFRAMES[lowerIndex]!.profile;
  const upper = WORLD_LIGHTING_KEYFRAMES[upperIndex]!.profile;
  const next =
    WORLD_LIGHTING_KEYFRAMES[nextIndex]?.profile ??
    WORLD_LIGHTING_KEYFRAMES[upperIndex]!.profile;

  return {
    skyColor: mixColorSpline(
      previous.skyColor,
      lower.skyColor,
      upper.skyColor,
      next.skyColor,
      progress,
    ),
    overlayColor: mixColorSpline(
      previous.overlayColor,
      lower.overlayColor,
      upper.overlayColor,
      next.overlayColor,
      progress,
    ),
    overlayAlpha: catmullRom(
      previous.overlayAlpha,
      lower.overlayAlpha,
      upper.overlayAlpha,
      next.overlayAlpha,
      progress,
    ),
    ambientBrightness: catmullRom(
      previous.ambientBrightness,
      lower.ambientBrightness,
      upper.ambientBrightness,
      next.ambientBrightness,
      progress,
    ),
    shaftAlpha: catmullRom(
      previous.shaftAlpha,
      lower.shaftAlpha,
      upper.shaftAlpha,
      next.shaftAlpha,
      progress,
    ),
    celestialTint: mixColorSpline(
      previous.celestialTint,
      lower.celestialTint,
      upper.celestialTint,
      next.celestialTint,
      progress,
    ),
    celestialAlpha: catmullRom(
      previous.celestialAlpha,
      lower.celestialAlpha,
      upper.celestialAlpha,
      next.celestialAlpha,
      progress,
    ),
    cloudAlphaBoost: catmullRom(
      previous.cloudAlphaBoost,
      lower.cloudAlphaBoost,
      upper.cloudAlphaBoost,
      next.cloudAlphaBoost,
      progress,
    ),
  };
}

function wrappedMinuteForIndex(index: number, referenceMinute: number) {
  const minute = WORLD_LIGHTING_KEYFRAMES[index]?.minute ?? 0;
  return minute <= referenceMinute ? minute + GAME_DAY_MINUTES : minute;
}

function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  progress: number,
) {
  const t = clamp(progress);
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function mixColorSpline(
  c0: number,
  c1: number,
  c2: number,
  c3: number,
  progress: number,
) {
  const [r0, g0, b0] = unpackColor(c0).map(toLinearChannel);
  const [r1, g1, b1] = unpackColor(c1).map(toLinearChannel);
  const [r2, g2, b2] = unpackColor(c2).map(toLinearChannel);
  const [r3, g3, b3] = unpackColor(c3).map(toLinearChannel);
  const red = clamp01(catmullRom(r0 ?? 0, r1 ?? 0, r2 ?? 0, r3 ?? 0, progress));
  const green = clamp01(
    catmullRom(g0 ?? 0, g1 ?? 0, g2 ?? 0, g3 ?? 0, progress),
  );
  const blue = clamp01(
    catmullRom(b0 ?? 0, b1 ?? 0, b2 ?? 0, b3 ?? 0, progress),
  );
  return (
    (Math.round(toSrgbChannel(red)) << 16) |
    (Math.round(toSrgbChannel(green)) << 8) |
    Math.round(toSrgbChannel(blue))
  );
}

function unpackColor(color: number) {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff] as const;
}

function toLinearChannel(channel: number) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function toSrgbChannel(channel: number) {
  const value = clamp01(channel);
  return (
    255 *
    (value <= 0.0031308
      ? value * 12.92
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055)
  );
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function applyBloodMoonLighting(
  lighting: TimeOfDayLighting,
): TimeOfDayLighting {
  const bloodMoonLighting = WORLD_EVENT_LIGHTING.bloodMoon;
  return {
    ...lighting,
    skyColor: mixColor(
      lighting.skyColor,
      bloodMoonLighting.skyColor,
      bloodMoonLighting.skyMix,
    ),
    overlayColor: mixColor(
      lighting.overlayColor,
      bloodMoonLighting.overlayColor,
      bloodMoonLighting.overlayMix,
    ),
    overlayAlpha: Math.min(
      bloodMoonLighting.overlayAlphaCap,
      lighting.overlayAlpha + bloodMoonLighting.overlayAlphaBoost,
    ),
    ambientBrightness: Math.max(
      bloodMoonLighting.ambientBrightnessFloor,
      lighting.ambientBrightness * bloodMoonLighting.ambientBrightnessScale,
    ),
    celestialTint: mixColor(
      lighting.celestialTint,
      bloodMoonLighting.celestialTint,
      bloodMoonLighting.celestialTintMix,
    ),
    celestialAlpha: Math.min(
      1,
      lighting.celestialAlpha + bloodMoonLighting.celestialAlphaBoost,
    ),
    moonShaftOpacity: Math.min(
      1,
      lighting.moonShaftOpacity + bloodMoonLighting.moonShaftOpacityBoost,
    ),
  };
}

function applyHarvestMoonLighting(
  lighting: TimeOfDayLighting,
): TimeOfDayLighting {
  const harvestMoonLighting = WORLD_EVENT_LIGHTING.harvestMoon;
  return {
    ...lighting,
    skyColor: mixColor(
      lighting.skyColor,
      harvestMoonLighting.skyColor,
      harvestMoonLighting.skyMix,
    ),
    overlayColor: mixColor(
      lighting.overlayColor,
      harvestMoonLighting.overlayColor,
      harvestMoonLighting.overlayMix,
    ),
    overlayAlpha: Math.min(
      harvestMoonLighting.overlayAlphaCap,
      lighting.overlayAlpha + harvestMoonLighting.overlayAlphaBoost,
    ),
    ambientBrightness: Math.max(
      harvestMoonLighting.ambientBrightnessFloor,
      lighting.ambientBrightness * harvestMoonLighting.ambientBrightnessScale,
    ),
    celestialTint: mixColor(
      lighting.celestialTint,
      harvestMoonLighting.celestialTint,
      harvestMoonLighting.celestialTintMix,
    ),
    celestialAlpha: Math.min(
      1,
      lighting.celestialAlpha + harvestMoonLighting.celestialAlphaBoost,
    ),
    moonShaftOpacity: Math.min(
      1,
      lighting.moonShaftOpacity + harvestMoonLighting.moonShaftOpacityBoost,
    ),
  };
}

export function scaleColor(color: number, brightness: number) {
  const multiplier = Math.max(0, brightness);
  const red = Math.min(255, Math.round(((color >> 16) & 0xff) * multiplier));
  const green = Math.min(255, Math.round(((color >> 8) & 0xff) * multiplier));
  const blue = Math.min(255, Math.round((color & 0xff) * multiplier));
  return (red << 16) | (green << 8) | blue;
}
