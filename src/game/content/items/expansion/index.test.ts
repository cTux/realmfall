import { CRAFTED_EXPANSION_ITEM_CONFIGS } from './index';

describe('crafted expansion item configs', () => {
  it('discovers unique configs from the expansion directory', () => {
    const keys = CRAFTED_EXPANSION_ITEM_CONFIGS.map((config) => config.key);

    expect(CRAFTED_EXPANSION_ITEM_CONFIGS.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('ashen-blade');
    expect(keys).toContain('moss-cloak');
  });
});
