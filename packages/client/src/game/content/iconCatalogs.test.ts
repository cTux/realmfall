import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ABILITY_ICON_IDS,
  CONTENT_ICON_IDS,
  STATUS_EFFECT_ICON_IDS,
} from './iconIds';

const iconSourceFiles = [
  new URL('./icons.ts', import.meta.url),
  new URL('./statusEffects.ts', import.meta.url),
  new URL('../abilities.ts', import.meta.url),
].map((url) => fileURLToPath(url));

function moduleSource(path: string) {
  return readFileSync(path, 'utf8');
}

describe('gameplay icon catalogs', () => {
  it('do not import raw SVG asset files', () => {
    for (const path of iconSourceFiles) {
      const source = moduleSource(path);
      expect(source).not.toMatch(/\.svg['"]/);
    }
  });

  it('use stable icon-id values', () => {
    const stableIdPattern = /^([a-z][a-z-]*):([a-z][a-z0-9-]*)$/;

    Object.values(CONTENT_ICON_IDS).forEach((id) => {
      expect(stableIdPattern.test(id)).toBe(true);
    });
    Object.values(ABILITY_ICON_IDS).forEach((id) => {
      expect(stableIdPattern.test(id)).toBe(true);
    });
    Object.values(STATUS_EFFECT_ICON_IDS).forEach((id) => {
      expect(stableIdPattern.test(id)).toBe(true);
    });
  });
});
