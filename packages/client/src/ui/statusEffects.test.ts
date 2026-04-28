import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('status effect icon assets', () => {
  const recentDeathSvgPath = resolve(
    process.cwd(),
    'src/assets/icons/recent-death.svg',
  );
  const restorationSvgPath = resolve(
    process.cwd(),
    'src/assets/icons/restoration.svg',
  );

  it('uses transparent mask-safe SVGs for death effect icons', () => {
    const recentDeathSvg = readFileSync(recentDeathSvgPath, 'utf8');
    const restorationSvg = readFileSync(restorationSvgPath, 'utf8');

    expect(recentDeathSvg).not.toContain('M0 0h512v512H0z');
    expect(restorationSvg).not.toContain('M0 0h512v512H0z');
  });
});
