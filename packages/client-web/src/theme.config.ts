import type { ItemRarity } from '@realmfall/core/game/stateTypes';

export interface LightingProfile {
  ambientBrightness: number;
  celestialAlpha: number;
  celestialTint: number;
  cloudAlphaBoost: number;
  overlayAlpha: number;
  overlayColor: number;
  shaftAlpha: number;
  skyColor: number;
}

export const APP_BACKGROUND_COLORS = Object.freeze({
  pixiWorld: 0x0b1020,
});

export const BOOTSTRAP_SCREEN_COLORS = Object.freeze({
  background: '#050814',
  spinnerActive: '#fff',
  spinnerTrack: 'rgba(255, 255, 255, 0.35)',
});

export const ICON_TINT_COLORS = Object.freeze({
  favorite: '#f59e0b',
  locked: '#ef4444',
  muted: '#94a3b8',
  neutral: '#f8fafc',
  recipeBlocked: 'rgba(248, 113, 113, 0.92)',
  recipeUnavailable: 'rgba(148, 163, 184, 0.45)',
  secondaryStat: 'rgba(34, 197, 94, 0.9)',
  sellValue: '#fbbf24',
});

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#f8fafc',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fb923c',
};

export const STATUS_EFFECT_FALLBACK_TINTS = Object.freeze({
  buff: '#4ade80',
  debuff: '#f87171',
});

export const STATUS_ICON_BORDER_COLORS = Object.freeze({
  buff: 'rgb(34 197 94 / 70%)',
  debuff: 'rgb(239 68 68 / 70%)',
  neutral: 'rgb(148 163 184 / 35%)',
});

export const TOOLTIP_BORDER_COLORS = Object.freeze({
  danger: 'rgba(248, 113, 113, 0.9)',
  dungeonEnemy: '#a855f7',
  hunger: 'rgba(251, 146, 60, 0.9)',
  info: 'rgba(125, 211, 252, 0.9)',
  mana: 'rgba(103, 232, 249, 0.9)',
  neutral: 'rgba(148, 163, 184, 0.9)',
  positive: 'rgba(74, 222, 128, 0.9)',
  structure: 'rgba(56, 189, 248, 0.9)',
  warning: 'rgba(250, 204, 21, 0.9)',
  xp: 'rgba(167, 139, 250, 0.9)',
});

export const WORLD_RENDER_COLORS = Object.freeze({
  combatWorldIcon: 0xef4444,
  defaultEnemyIcon: 0x60a5fa,
  dungeonSky: 0x0b1220,
  homeHexTint: 0xa855f7,
  levelUpGlow: 0xfbbf24,
  lowHpWarning: 0x991b1b,
  movementCooldownBar: 0xfacc15,
  playerBarTrack: 0x422006,
  queuedPathTint: 0x22c55e,
  safePathTint: 0x38bdf8,
  structureHexIconTint: 0xffffff,
  worldBossHexTint: 0x7f1d1d,
});

export const WORLD_LIGHTING_KEYFRAMES: Array<{
  minute: number;
  profile: LightingProfile;
}> = [
  {
    minute: 0,
    profile: {
      ambientBrightness: 0.66,
      celestialAlpha: 0.74,
      celestialTint: 0xdbeafe,
      cloudAlphaBoost: -0.04,
      overlayAlpha: 0.4,
      overlayColor: 0x020617,
      shaftAlpha: 0.11,
      skyColor: 0x020617,
    },
  },
  {
    minute: 300,
    profile: {
      ambientBrightness: 0.72,
      celestialAlpha: 0.62,
      celestialTint: 0xcbd5ff,
      cloudAlphaBoost: -0.02,
      overlayAlpha: 0.36,
      overlayColor: 0x020617,
      shaftAlpha: 0.09,
      skyColor: 0x06101f,
    },
  },
  {
    minute: 420,
    profile: {
      ambientBrightness: 0.96,
      celestialAlpha: 0.8,
      celestialTint: 0xfff4c2,
      cloudAlphaBoost: 0,
      overlayAlpha: 0.1,
      overlayColor: 0x1e293b,
      shaftAlpha: 0.18,
      skyColor: 0x5fa7dd,
    },
  },
  {
    minute: 720,
    profile: {
      ambientBrightness: 1.18,
      celestialAlpha: 0.92,
      celestialTint: 0xfff1a8,
      cloudAlphaBoost: 0.04,
      overlayAlpha: 0.04,
      overlayColor: 0xfff7ed,
      shaftAlpha: 0.32,
      skyColor: 0xdbeafe,
    },
  },
  {
    minute: 1080,
    profile: {
      ambientBrightness: 0.94,
      celestialAlpha: 0.5,
      celestialTint: 0xffedd5,
      cloudAlphaBoost: -0.01,
      overlayAlpha: 0.1,
      overlayColor: 0x78350f,
      shaftAlpha: 0.16,
      skyColor: 0xf59e0b,
    },
  },
  {
    minute: 1200,
    profile: {
      ambientBrightness: 0.74,
      celestialAlpha: 0.8,
      celestialTint: 0xcbd5ff,
      cloudAlphaBoost: -0.02,
      overlayAlpha: 0.24,
      overlayColor: 0x020617,
      shaftAlpha: 0.11,
      skyColor: 0x1e293b,
    },
  },
];

export const WORLD_EVENT_LIGHTING = Object.freeze({
  bloodMoon: {
    ambientBrightnessFloor: 0.6,
    ambientBrightnessScale: 0.9,
    celestialAlphaBoost: 0.18,
    celestialTint: 0xff4d5d,
    celestialTintMix: 0.88,
    moonShaftOpacityBoost: 0.26,
    overlayAlphaBoost: 0.1,
    overlayAlphaCap: 0.66,
    overlayColor: 0x2a0208,
    overlayMix: 0.82,
    skyColor: 0x220409,
    skyMix: 0.68,
  },
  harvestMoon: {
    ambientBrightnessFloor: 0.68,
    ambientBrightnessScale: 0.94,
    celestialAlphaBoost: 0.14,
    celestialTint: 0x67e8f9,
    celestialTintMix: 0.9,
    moonShaftOpacityBoost: 0.28,
    overlayAlphaBoost: 0.08,
    overlayAlphaCap: 0.56,
    overlayColor: 0x0c4a6e,
    overlayMix: 0.74,
    skyColor: 0x083344,
    skyMix: 0.68,
  },
});
