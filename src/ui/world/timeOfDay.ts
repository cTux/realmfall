export const GAME_DAY_MINUTES = 24 * 60;
export const GAME_DAY_DURATION_MS = 60 * 1000;
export const MOONRISE_START = 18 * 60;
export const MOONRISE_END = 20 * 60;
export const DAYLIGHT_START = 7 * 60;

interface LightingProfile {
  skyColor: number;
  overlayColor: number;
  overlayAlpha: number;
  ambientBrightness: number;
  shaftAlpha: number;
  celestialTint: number;
  celestialAlpha: number;
  cloudAlphaBoost: number;
}

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

const SUNRISE_START = 5 * 60;
const SUNRISE_END = DAYLIGHT_START;
const SUNSET_START = MOONRISE_START;
const SUNSET_END = MOONRISE_END;

const LIGHTING_KEYFRAMES: Array<{ minute: number; profile: LightingProfile }> =
  [
    {
      minute: 0,
      profile: {
        skyColor: 0x020617,
        overlayColor: 0x020617,
        overlayAlpha: 0.48,
        ambientBrightness: 0.52,
        shaftAlpha: 0.08,
        celestialTint: 0xdbeafe,
        celestialAlpha: 0.62,
        cloudAlphaBoost: -0.04,
      },
    },
    {
      minute: 5 * 60,
      profile: {
        skyColor: 0x06101f,
        overlayColor: 0x020617,
        overlayAlpha: 0.42,
        ambientBrightness: 0.58,
        shaftAlpha: 0.06,
        celestialTint: 0xcbd5ff,
        celestialAlpha: 0.5,
        cloudAlphaBoost: -0.02,
      },
    },
    {
      minute: 7 * 60,
      profile: {
        skyColor: 0x5fa7dd,
        overlayColor: 0x1e293b,
        overlayAlpha: 0.1,
        ambientBrightness: 0.96,
        shaftAlpha: 0.18,
        celestialTint: 0xfff4c2,
        celestialAlpha: 0.8,
        cloudAlphaBoost: 0,
      },
    },
    {
      minute: 12 * 60,
      profile: {
        skyColor: 0xdbeafe,
        overlayColor: 0xfff7ed,
        overlayAlpha: 0.04,
        ambientBrightness: 1.18,
        shaftAlpha: 0.32,
        celestialTint: 0xfff1a8,
        celestialAlpha: 0.92,
        cloudAlphaBoost: 0.04,
      },
    },
    {
      minute: 18 * 60,
      profile: {
        skyColor: 0xf59e0b,
        overlayColor: 0x78350f,
        overlayAlpha: 0.1,
        ambientBrightness: 0.94,
        shaftAlpha: 0.16,
        celestialTint: 0xffedd5,
        celestialAlpha: 0.5,
        cloudAlphaBoost: -0.01,
      },
    },
    {
      minute: 20 * 60,
      profile: {
        skyColor: 0x1e293b,
        overlayColor: 0x020617,
        overlayAlpha: 0.3,
        ambientBrightness: 0.62,
        shaftAlpha: 0.08,
        celestialTint: 0xcbd5ff,
        celestialAlpha: 0.66,
        cloudAlphaBoost: -0.02,
      },
    },
  ];

export function getWorldTimeMinutesFromTimestamp(timestampMs: number) {
  const normalizedMs =
    ((timestampMs % GAME_DAY_DURATION_MS) + GAME_DAY_DURATION_MS) %
    GAME_DAY_DURATION_MS;
  return (normalizedMs / GAME_DAY_DURATION_MS) * GAME_DAY_MINUTES;
}

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

export function getTimeOfDayLighting(
  totalMinutes: number,
  options?: { bloodMoon?: boolean },
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
    moonShaftOpacity: moonOpacity * smoothLerp(0.2, 0.55, moonOpacity),
  };

  return options?.bloodMoon ? applyBloodMoonLighting(lighting) : lighting;
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
    LIGHTING_KEYFRAMES.findIndex((keyframe) => keyframe.minute > minutes) === -1
      ? 0
      : LIGHTING_KEYFRAMES.findIndex((keyframe) => keyframe.minute > minutes);
  const lowerIndex =
    (upperIndex - 1 + LIGHTING_KEYFRAMES.length) % LIGHTING_KEYFRAMES.length;
  const previousIndex =
    (lowerIndex - 1 + LIGHTING_KEYFRAMES.length) % LIGHTING_KEYFRAMES.length;
  const nextIndex = (upperIndex + 1) % LIGHTING_KEYFRAMES.length;
  const lowerMinute = LIGHTING_KEYFRAMES[lowerIndex]?.minute ?? 0;
  const upperMinute = wrappedMinuteForIndex(upperIndex, lowerMinute);
  const progress = smootherstep(
    (minutes - lowerMinute) / Math.max(1, upperMinute - lowerMinute),
  );
  const previous =
    LIGHTING_KEYFRAMES[previousIndex]?.profile ??
    LIGHTING_KEYFRAMES[lowerIndex]!.profile;
  const lower = LIGHTING_KEYFRAMES[lowerIndex]!.profile;
  const upper = LIGHTING_KEYFRAMES[upperIndex]!.profile;
  const next =
    LIGHTING_KEYFRAMES[nextIndex]?.profile ??
    LIGHTING_KEYFRAMES[upperIndex]!.profile;

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
  const minute = LIGHTING_KEYFRAMES[index]?.minute ?? 0;
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
  return {
    ...lighting,
    skyColor: mixColor(lighting.skyColor, 0x220409, 0.68),
    overlayColor: mixColor(lighting.overlayColor, 0x2a0208, 0.82),
    overlayAlpha: Math.min(0.74, lighting.overlayAlpha + 0.16),
    ambientBrightness: Math.max(0.34, lighting.ambientBrightness * 0.7),
    celestialTint: mixColor(lighting.celestialTint, 0xff4d5d, 0.88),
    celestialAlpha: Math.min(1, lighting.celestialAlpha + 0.1),
    moonShaftOpacity: Math.min(1, lighting.moonShaftOpacity + 0.18),
  };
}

export function scaleColor(color: number, brightness: number) {
  const multiplier = Math.max(0, brightness);
  const red = Math.min(255, Math.round(((color >> 16) & 0xff) * multiplier));
  const green = Math.min(255, Math.round(((color >> 8) & 0xff) * multiplier));
  const blue = Math.min(255, Math.round((color & 0xff) * multiplier));
  return (red << 16) | (green << 8) | blue;
}
