import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { STATUS_MASK_ICON_PATHS } from './statusEffectsTestkit';

describe('status effect mask icons', () => {
  it('do not contain full-canvas background paths', () => {
    for (const relativePath of STATUS_MASK_ICON_PATHS) {
      const svg = readFileSync(new URL(relativePath, import.meta.url), 'utf8');

      expect(svg).not.toContain('M0 0h512v512H0z');
    }
  });
});
