export interface WindowLabelDefinition {
  plain: string;
  prefix: string;
  hotkey: string;
  suffix: string;
}

export const WINDOW_LABELS = {
  worldTime: {
    plain: 'Debugger',
    prefix: '(',
    hotkey: 'D',
    suffix: ')ebugger',
  },
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
  recipes: {
    plain: 'Recipe book',
    prefix: '(',
    hotkey: 'R',
    suffix: ')ecipe book',
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
