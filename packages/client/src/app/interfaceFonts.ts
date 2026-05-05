export type InterfaceFontFamily = 'pixelifySans' | 'roboto' | 'ubuntu';

export interface InterfaceFontOptionDefinition {
  labelKey: string;
  value: InterfaceFontFamily;
}

interface InterfaceFontDefinition {
  cssFamily: string;
  loadDescriptors: string[];
  stack: string;
}

const APP_FONT_CSS_VARIABLE = '--app-font-family';

const INTERFACE_FONT_DEFINITIONS = {
  pixelifySans: {
    cssFamily: '"Pixelify Sans"',
    loadDescriptors: ['400 1em "Pixelify Sans"', '700 1em "Pixelify Sans"'],
    stack: '"Pixelify Sans", system-ui, sans-serif',
  },
  roboto: {
    cssFamily: '"Roboto"',
    loadDescriptors: ['400 1em "Roboto"', '700 1em "Roboto"'],
    stack: '"Roboto", system-ui, sans-serif',
  },
  ubuntu: {
    cssFamily: '"Ubuntu"',
    loadDescriptors: ['400 1em "Ubuntu"', '700 1em "Ubuntu"'],
    stack: '"Ubuntu", system-ui, sans-serif',
  },
} satisfies Record<InterfaceFontFamily, InterfaceFontDefinition>;

export const DEFAULT_INTERFACE_FONT_FAMILY: InterfaceFontFamily =
  'pixelifySans';
let appliedInterfaceFontStack = resolveInterfaceFontStack(
  DEFAULT_INTERFACE_FONT_FAMILY,
);

export const INTERFACE_FONT_OPTIONS: InterfaceFontOptionDefinition[] = [
  {
    labelKey: 'ui.settings.interface.fontFamily.option.pixelifySans',
    value: 'pixelifySans',
  },
  {
    labelKey: 'ui.settings.interface.fontFamily.option.roboto',
    value: 'roboto',
  },
  {
    labelKey: 'ui.settings.interface.fontFamily.option.ubuntu',
    value: 'ubuntu',
  },
];

export function isInterfaceFontFamily(
  value: unknown,
): value is InterfaceFontFamily {
  return typeof value === 'string' && value in INTERFACE_FONT_DEFINITIONS;
}

export function resolveInterfaceFontStack(fontFamily: InterfaceFontFamily) {
  return INTERFACE_FONT_DEFINITIONS[fontFamily].stack;
}

export function getAppliedInterfaceFontStack() {
  const fallback = appliedInterfaceFontStack;
  if (typeof document === 'undefined') {
    return fallback;
  }

  const inlineStack = document.documentElement.style
    .getPropertyValue(APP_FONT_CSS_VARIABLE)
    .trim();
  if (inlineStack.length > 0) {
    return inlineStack;
  }

  const computedStack = globalThis
    .getComputedStyle?.(document.documentElement)
    ?.getPropertyValue(APP_FONT_CSS_VARIABLE)
    .trim();

  return computedStack && computedStack.length > 0 ? computedStack : fallback;
}

export function applyInterfaceFontFamily(fontFamily: InterfaceFontFamily) {
  appliedInterfaceFontStack = resolveInterfaceFontStack(fontFamily);
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty(
    APP_FONT_CSS_VARIABLE,
    appliedInterfaceFontStack,
  );
}

export async function loadInterfaceFontFamily(fontFamily: InterfaceFontFamily) {
  if (typeof document === 'undefined' || document.fonts == null) {
    return;
  }

  const { loadDescriptors } = INTERFACE_FONT_DEFINITIONS[fontFamily];

  await Promise.all(
    loadDescriptors.map((descriptor) => document.fonts.load(descriptor)),
  );
}
