export const TAB_LABEL_KEYS = {
  audio: 'ui.settings.tabs.audio',
  gameplay: 'ui.settings.tabs.gameplay',
  graphics: 'ui.settings.tabs.graphics',
  interface: 'ui.settings.tabs.interface',
  saves: 'ui.settings.tabs.saves',
} as const;

export const GRAPHICS_LABEL_KEYS = {
  antialias: 'ui.settings.graphics.antialias.label',
  cloudTransparency: 'ui.settings.graphics.cloudTransparency.label',
  showClouds: 'ui.settings.graphics.showClouds.label',
  showTerrainBackgrounds: 'ui.settings.graphics.showTerrainBackgrounds.label',
  worldRenderFps: 'ui.settings.graphics.worldRenderFps.label',
} as const;

export const AUDIO_LABEL_KEYS = {
  musicMuted: 'ui.settings.audio.musicMuted.label',
  musicVolume: 'ui.settings.audio.musicVolume.label',
  voiceActor: 'ui.settings.audio.voice.actor.label',
} as const;

export const INTERFACE_LABEL_KEYS = {
  fontFamily: 'ui.settings.interface.fontFamily.label',
  fontSize: 'ui.settings.interface.fontSize.label',
  interfaceScale: 'ui.settings.interface.interfaceScale.label',
  language: 'ui.settings.interface.language.label',
  showTooltipTags: 'ui.settings.interface.showTooltipTags.label',
  windowTransparency: 'ui.settings.interface.windowTransparency.label',
} as const;

export const GAMEPLAY_LABEL_KEYS = {
  autoGatherResources: 'ui.settings.gameplay.autoGatherResources.label',
  autoLoot: 'ui.settings.gameplay.autoLoot.label',
  autoStartCombat: 'ui.settings.gameplay.autoStartCombat.label',
} as const;
