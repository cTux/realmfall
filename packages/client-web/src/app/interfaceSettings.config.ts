import { DEFAULT_INTERFACE_FONT_FAMILY } from './interfaceFonts';

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
