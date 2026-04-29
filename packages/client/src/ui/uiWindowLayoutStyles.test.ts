import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('inventory and recipe book window layout styles', () => {
  it('keeps the shared window body clipped while inner inventory content scrolls', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/ui/components/InventoryWindow/styles.module.scss',
      ),
      'utf8',
    );

    expect(source).toMatch(/\.windowBody\s*\{[\s\S]*?\boverflow:\s*hidden;/u);
    expect(source).toMatch(/\.content\s*\{[\s\S]*?\boverflow:\s*hidden;/u);
  });

  it('keeps the shared window body clipped while the recipe list owns scrolling', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/ui/components/RecipeBookWindow/styles.module.scss',
      ),
      'utf8',
    );

    expect(source).toMatch(/\.windowBody\s*\{[\s\S]*?\boverflow:\s*hidden;/u);
    expect(source).toMatch(/\.content\s*\{[\s\S]*?\bflex:\s*1\s+1\s+auto;/u);
    expect(source).toMatch(/\.content\s*\{[\s\S]*?\boverflow:\s*hidden;/u);
  });
});
