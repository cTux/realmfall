export const GAME_DAY_MINUTES = 24 * 60;
export const GAME_DAY_DURATION_MS = 60 * 1000;

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
    {
      minute: GAME_DAY_MINUTES,
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

export function getTimeOfDayLighting(totalMinutes: number) {
  const minutes =
    ((totalMinutes % GAME_DAY_MINUTES) + GAME_DAY_MINUTES) % GAME_DAY_MINUTES;
  const nextIndex = LIGHTING_KEYFRAMES.findIndex(
    (keyframe) => keyframe.minute >= minutes,
  );
  const upperIndex = nextIndex <= 0 ? 1 : nextIndex;
  const lower = LIGHTING_KEYFRAMES[upperIndex - 1];
  const upper = LIGHTING_KEYFRAMES[upperIndex];
  const segmentProgress =
    (minutes - lower.minute) / Math.max(1, upper.minute - lower.minute);
  const progress = smoothstep(segmentProgress);

  return {
    skyColor: mixColor(
      lower.profile.skyColor,
      upper.profile.skyColor,
      progress,
    ),
    overlayColor: mixColor(
      lower.profile.overlayColor,
      upper.profile.overlayColor,
      progress,
    ),
    overlayAlpha: lerp(
      lower.profile.overlayAlpha,
      upper.profile.overlayAlpha,
      progress,
    ),
    ambientBrightness: lerp(
      lower.profile.ambientBrightness,
      upper.profile.ambientBrightness,
      progress,
    ),
    shaftAlpha: lerp(
      lower.profile.shaftAlpha,
      upper.profile.shaftAlpha,
      progress,
    ),
    celestialBody:
      minutes >= 6 * 60 && minutes < 19 * 60
        ? ('sun' as const)
        : ('moon' as const),
    celestialTint: mixColor(
      lower.profile.celestialTint,
      upper.profile.celestialTint,
      progress,
    ),
    celestialAlpha: lerp(
      lower.profile.celestialAlpha,
      upper.profile.celestialAlpha,
      progress,
    ),
    cloudAlphaBoost: lerp(
      lower.profile.cloudAlphaBoost,
      upper.profile.cloudAlphaBoost,
      progress,
    ),
  };
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * clamp(progress);
}

function smoothstep(progress: number) {
  const amount = clamp(progress);
  return amount * amount * (3 - 2 * amount);
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mixColor(from: number, to: number, progress: number) {
  const amount = clamp(progress);
  const fromR = (from >> 16) & 0xff;
  const fromG = (from >> 8) & 0xff;
  const fromB = from & 0xff;
  const toR = (to >> 16) & 0xff;
  const toG = (to >> 8) & 0xff;
  const toB = to & 0xff;

  const red = Math.round(lerp(fromR, toR, amount));
  const green = Math.round(lerp(fromG, toG, amount));
  const blue = Math.round(lerp(fromB, toB, amount));

  return (red << 16) | (green << 8) | blue;
}

export function scaleColor(color: number, brightness: number) {
  const multiplier = Math.max(0, brightness);
  const red = Math.min(255, Math.round(((color >> 16) & 0xff) * multiplier));
  const green = Math.min(255, Math.round(((color >> 8) & 0xff) * multiplier));
  const blue = Math.min(255, Math.round((color & 0xff) * multiplier));
  return (red << 16) | (green << 8) | blue;
}
