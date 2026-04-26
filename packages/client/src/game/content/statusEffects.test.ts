import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const STATUS_MASK_ICON_PATHS = [
  '../../assets/icons/status-bleeding.svg',
  '../../assets/icons/status-poison.svg',
  '../../assets/icons/status-burning.svg',
  '../../assets/icons/status-chilling.svg',
  '../../assets/icons/status-power.svg',
  '../../assets/icons/status-frenzy.svg',
] as const;

describe('status effect mask icons', () => {
  it('do not contain full-canvas background paths', () => {
    for (const relativePath of STATUS_MASK_ICON_PATHS) {
      const svg = readFileSync(new URL(relativePath, import.meta.url), 'utf8');

      expect(svg).not.toContain('M0 0h512v512H0z');
    }
  });
});
