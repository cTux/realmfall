import { describe, expect, it } from 'vitest';
import {
  GENERATED_ICON_POOL_SIZES,
  GENERATED_ICON_POOLS,
  type GeneratedIconPoolKey,
} from '../game/content/generatedIconPools';
import {
  GENERATED_ICON_ASSET_POOLS,
  resolveGeneratedIconAsset,
} from './generatedIconAssets';

describe('generated icon assets', () => {
  it('keeps UI asset pools aligned with gameplay generated icon ids', () => {
    Object.entries(GENERATED_ICON_POOLS).forEach(([familyKey, iconIds]) => {
      const iconFamilyKey = familyKey as GeneratedIconPoolKey;

      expect(GENERATED_ICON_ASSET_POOLS[iconFamilyKey]?.length).toBe(
        GENERATED_ICON_POOL_SIZES[iconFamilyKey],
      );
      expect(GENERATED_ICON_ASSET_POOLS[iconFamilyKey]).toHaveLength(
        iconIds.length,
      );

      iconIds.forEach((iconId) => {
        const asset = resolveGeneratedIconAsset(iconId);
        expect(asset).not.toBe(iconId);
        expect(asset).not.toMatch(/^https?:\/\//);
        expect(asset).toMatch(
          /^(data:image\/svg\+xml,|\/src\/assets\/icons\/generated\/|\.\/|\/|\/assets\/icons\/)/,
        );
      });
    });
  });
});
