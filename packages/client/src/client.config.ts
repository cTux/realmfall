import playerIcon from './assets/icons/visored-helm.svg';
import sparklesIcon from './assets/icons/sparkles.svg';
import bookCoverIcon from './assets/icons/book-cover.svg';
import tiedScrollIcon from './assets/icons/tied-scroll.svg';
import villageIcon from './assets/icons/village.svg';
import armorIcon from './assets/icons/checked-shield.svg';
import stonePileIcon from './assets/icons/stone-pile.svg';
import backpackIcon from './assets/game-icons/delapouite/backpack.svg';
import enemyIcon from './assets/icons/wolf-head.svg';
import gearsIcon from './assets/icons/gears.svg';
import toolboxIcon from './assets/game-icons/delapouite/toolbox.svg';
import { DEFAULT_INTERFACE_FONT_FAMILY } from './app/interfaceFonts';

export interface WindowPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export type WindowMountSource =
  | 'windowShown'
  | 'lootTransition'
  | 'combatTransition';

export const CLIENT_WORLD_VIEWPORT = Object.freeze({
  minimumHeight: 480,
  minimumWidth: 640,
});

export const CLIENT_INTERFACE_SETTINGS = Object.freeze({
  defaults: {
    fontFamily: DEFAULT_INTERFACE_FONT_FAMILY,
    fontSize: 100,
    interfaceScale: 100,
    language: 'en' as const,
    showTooltipTags: true,
    windowTransparency: 0,
  },
  percentScaleDivisor: 100,
  ranges: {
    fontSize: {
      max: 150,
      min: 75,
      step: 1,
    },
    interfaceScale: {
      max: 150,
      min: 75,
      step: 1,
    },
    windowTransparency: {
      max: 100,
      min: 0,
      step: 1,
    },
  },
});

export const CLIENT_BOOTSTRAP_SHELL = Object.freeze({
  spinnerAnimationSeconds: 0.75,
  spinnerBorderRadiusPx: 9999,
  spinnerBorderWidthPx: 3,
  spinnerSizeRem: 2,
});

export const CLIENT_INVENTORY_UI = Object.freeze({
  disabledFilterOpacity: 0.5,
});

export const CLIENT_WORLD_RENDER_SETTINGS = Object.freeze({
  homeHexTintAlpha: 0.22,
  homeHexTintInset: 3,
  playerBadgeBackgroundAlpha: 0.6,
  playerBarFillAlpha: 0.95,
  playerBarTrackAlpha: 0.85,
  queuedPathTintAlpha: 0.24,
  safePathHexInset: 2,
  safePathTintAlpha: 0.34,
  worldBossHexTintAlpha: 0.22,
});

export const CLIENT_FULLSCREEN_EFFECTS = Object.freeze({
  levelUpGlowMaxAlpha: 0.32,
  levelUpGlowMinAlpha: 0.16,
  levelUpGlowPulseMs: 900,
  lowHpWarningMaxAlpha: 0.2,
  lowHpWarningMinAlpha: 0.1,
  lowHpWarningPulseMs: 1_200,
  lowHpWarningThreshold: 0.3,
});

export const CLIENT_WINDOW_REGISTRY = {
  hero: {
    appDeferred: false,
    defaultPosition: { x: 96, y: 20 },
    dock: true,
    hotkey: 'h',
    icon: playerIcon,
    mountSource: 'windowShown',
  },
  skills: {
    appDeferred: true,
    defaultPosition: { x: 96, y: 430 },
    dock: true,
    hotkey: 's',
    icon: sparklesIcon,
    mountSource: 'windowShown',
  },
  recipes: {
    appDeferred: true,
    defaultPosition: { x: 620, y: 470 },
    dock: true,
    hotkey: 'r',
    icon: bookCoverIcon,
    mountSource: 'windowShown',
  },
  hexInfo: {
    appDeferred: true,
    defaultPosition: { x: 280, y: 20 },
    dock: true,
    hotkey: 'c',
    icon: villageIcon,
    mountSource: 'windowShown',
  },
  equipment: {
    appDeferred: true,
    defaultPosition: { x: 1000, y: 20 },
    dock: true,
    hotkey: 'e',
    icon: armorIcon,
    mountSource: 'windowShown',
  },
  inventory: {
    appDeferred: true,
    defaultPosition: { x: 820, y: 290 },
    dock: true,
    hotkey: 'i',
    icon: backpackIcon,
    mountSource: 'windowShown',
  },
  loot: {
    appDeferred: false,
    defaultPosition: { x: 820, y: 20 },
    dock: false,
    icon: stonePileIcon,
    mountSource: 'lootTransition',
  },
  log: {
    appDeferred: true,
    defaultPosition: { x: 420, y: 20 },
    dock: true,
    hotkey: 'g',
    icon: tiedScrollIcon,
    mountSource: 'windowShown',
  },
  debug: {
    appDeferred: true,
    defaultPosition: { height: 640, width: 760, x: 1040, y: 80 },
    dock: true,
    hotkey: 'd',
    icon: toolboxIcon,
    mountSource: 'windowShown',
  },
  combat: {
    appDeferred: false,
    defaultPosition: { x: 420, y: 470 },
    dock: false,
    icon: enemyIcon,
    mountSource: 'combatTransition',
  },
  settings: {
    appDeferred: true,
    defaultPosition: { height: 640, width: 640, x: 188, y: 72 },
    dock: true,
    hotkey: 'm',
    icon: gearsIcon,
    mountSource: 'windowShown',
  },
} as const satisfies Record<
  string,
  {
    defaultPosition: WindowPosition;
    dock: boolean;
    appDeferred: boolean;
    mountSource: WindowMountSource;
    hotkey?: string;
    icon: string;
  }
>;

export const EQUIPMENT_WINDOW_LAYOUT = Object.freeze({
  compactSlots: ['amulet', 'ringLeft', 'ringRight'] as const,
  reducedRadiusBorderRadius: '0 8px',
  reducedRadiusSlots: ['amulet', 'ringLeft', 'ringRight'] as const,
  slotPaddingRem: {
    compact: 0.06,
    regular: 0.12,
  },
  slotPositions: {
    amulet: { left: 25.5, top: 22 },
    belt: { left: 50, top: 49.5 },
    bracers: { left: 82.25, top: 41 },
    chest: { left: 50, top: 36.5 },
    cloak: { left: 50, top: 24.75 },
    feet: { left: 50, top: 83.5 },
    hands: { left: 17.75, top: 41 },
    head: { left: 50, top: 12.5 },
    legs: { left: 50, top: 64.25 },
    offhand: { left: 81.75, top: 69.75 },
    ringLeft: { left: 75.5, top: 55.75 },
    ringRight: { left: 24.5, top: 55.75 },
    shoulders: { left: 74.5, top: 16.25 },
    weapon: { left: 18.25, top: 69.75 },
  },
  slotSizePx: {
    compact: 19,
    regular: 38,
  },
});
