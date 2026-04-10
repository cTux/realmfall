import type { ReactNode } from 'react';

export interface WindowLabelDefinition {
  plain: string;
  prefix: string;
  hotkey: string;
  suffix: string;
}

export const WINDOW_LABELS = {
  hero: {
    plain: 'Character info',
    prefix: '(',
    hotkey: 'C',
    suffix: ')haracter info',
  },
  skills: {
    plain: 'Skills',
    prefix: '(',
    hotkey: 'S',
    suffix: ')kills',
  },
  legend: {
    plain: 'Legend',
    prefix: '(',
    hotkey: 'L',
    suffix: ')egend',
  },
  hexInfo: {
    plain: 'Hex info',
    prefix: '(',
    hotkey: 'H',
    suffix: ')ex info',
  },
  equipment: {
    plain: 'Equipment',
    prefix: '(',
    hotkey: 'E',
    suffix: ')quipment',
  },
  inventory: {
    plain: 'Inventory',
    prefix: '(',
    hotkey: 'I',
    suffix: ')nventory',
  },
  loot: {
    plain: 'Loot',
    prefix: '',
    hotkey: '',
    suffix: 'Loot',
  },
  log: {
    plain: 'Log',
    prefix: 'Lo(',
    hotkey: 'g',
    suffix: ')',
  },
  combat: {
    plain: 'Combat',
    prefix: '',
    hotkey: '',
    suffix: 'Combat',
  },
} as const;

export function renderWindowLabel(
  label: WindowLabelDefinition,
  hotkeyClassName: string,
  suffix?: ReactNode,
) {
  return (
    <>
      {label.prefix}
      {label.hotkey ? (
        <span className={hotkeyClassName}>{label.hotkey}</span>
      ) : null}
      {label.suffix}
      {suffix}
    </>
  );
}
