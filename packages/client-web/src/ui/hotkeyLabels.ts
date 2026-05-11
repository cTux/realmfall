const BRACKET_HOTKEY_LABEL_PATTERN = /^(.*)\((.)\)(.*)$/u;

export interface BracketHotkeyLabelParts {
  plain: string;
  prefix: string;
  hotkey: string;
  suffix: string;
}

export function parseBracketHotkeyLabel(
  label: string,
): BracketHotkeyLabelParts {
  const match = BRACKET_HOTKEY_LABEL_PATTERN.exec(label);
  if (!match) {
    return {
      plain: label,
      prefix: label,
      hotkey: '',
      suffix: '',
    };
  }

  const [, prefix, hotkey, suffix] = match;
  return {
    plain: `${prefix}${hotkey}${suffix}`,
    prefix,
    hotkey,
    suffix,
  };
}

export function stripBracketHotkeyLabel(label: string) {
  return parseBracketHotkeyLabel(label).plain;
}

export function stripHotkeyBracketGlyphs(segment: string) {
  return segment.replace(/[()]/g, '');
}

export function renderWindowHotkeyLabelText(label: {
  prefix: string;
  hotkey: string;
  suffix: string;
}) {
  return `${stripHotkeyBracketGlyphs(label.prefix)}${label.hotkey}${stripHotkeyBracketGlyphs(label.suffix)}`;
}
