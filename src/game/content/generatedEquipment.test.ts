import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CRAFTABLE_ICON_ITEM_CONFIGS } from './generatedCraftingEquipment';
import { GENERATED_EQUIPMENT_FAMILIES } from './generatedEquipmentFamilies';
import {
  GENERATED_EQUIPMENT_CONFIGS,
  GENERATED_ICON_POOLS,
} from './generatedEquipment';

describe('generated equipment icons', () => {
  it('uses vendored local assets for every generated icon pool entry', () => {
    Object.values(GENERATED_ICON_POOLS)
      .flat()
      .forEach((icon) => {
        expect(icon).not.toMatch(/^https?:\/\//);
        expect(icon).toMatch(
          /^(data:image\/svg\+xml,|\/src\/assets\/icons\/generated\/|\.\/|\/)/,
        );
      });
  });

  it('hydrates generated equipment configs from local icon pools', () => {
    GENERATED_EQUIPMENT_CONFIGS.forEach((config) => {
      expect(config.icon).not.toMatch(/^https?:\/\//);
      expect(config.iconPool?.length).toBeGreaterThan(0);
      expect(config.iconPool).toContain(config.icon);
    });
  });

  it('hydrates craftable icon configs from every family with craft metadata', () => {
    const expectedCraftableCount = GENERATED_EQUIPMENT_FAMILIES.reduce(
      (total, family) =>
        total +
        (family.craft ? GENERATED_ICON_POOLS[family.familyKey].length : 0),
      0,
    );

    expect(CRAFTABLE_ICON_ITEM_CONFIGS).toHaveLength(expectedCraftableCount);
  });

  it('keeps vendored generated SVGs mask-safe', () => {
    readdirSync(resolve(process.cwd(), 'src/assets/icons/generated'))
      .filter((file) => file.endsWith('.svg'))
      .forEach((file) => {
        const svg = readFileSync(
          resolve(process.cwd(), 'src/assets/icons/generated', file),
          'utf8',
        );

        expect(svg).not.toContain('M0 0h512v512H0z');
      });
  });
});
