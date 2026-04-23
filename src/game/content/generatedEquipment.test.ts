import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CRAFTABLE_ICON_ITEM_CONFIGS } from './generatedCraftingEquipment';
import { GENERATED_EQUIPMENT_FAMILIES } from './generatedEquipmentFamilies';
import { GENERATED_ICON_POOLS, isGeneratedIconId } from './generatedIconPools';
import { GENERATED_EQUIPMENT_CONFIGS } from './generatedEquipment';

describe('generated equipment icons', () => {
  it('uses generated icon ids for gameplay-facing icon pool entries', () => {
    Object.entries(GENERATED_ICON_POOLS).forEach(([familyKey, icons]) => {
      icons.forEach((icon, index) => {
        expect(icon).toBe(`generated-icon:${familyKey}:${index}`);
        expect(isGeneratedIconId(icon)).toBe(true);
      });
    });
  });

  it('keeps generated SVG asset imports out of gameplay icon pools', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/game/content/generatedIconPools.ts'),
      'utf8',
    );

    expect(source).not.toContain('assets/icons/generated');
  });

  it('hydrates generated equipment configs from generated icon ids', () => {
    GENERATED_EQUIPMENT_CONFIGS.forEach((config) => {
      expect(config.icon).not.toMatch(/^https?:\/\//);
      expect(config.iconPool?.length).toBeGreaterThan(0);
      expect(config.iconPool).toContain(config.icon);
      expect(isGeneratedIconId(config.icon)).toBe(true);
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
