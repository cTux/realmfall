import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recentDeathSvgPath, restorationSvgPath } from './statusEffectsTestkit';

describe('status effect icon assets', () => {
  it('uses transparent mask-safe SVGs for death effect icons', () => {
    const recentDeathSvg = readFileSync(recentDeathSvgPath, 'utf8');
    const restorationSvg = readFileSync(restorationSvgPath, 'utf8');

    expect(recentDeathSvg).not.toContain('M0 0h512v512H0z');
    expect(restorationSvg).not.toContain('M0 0h512v512H0z');
  });
});
