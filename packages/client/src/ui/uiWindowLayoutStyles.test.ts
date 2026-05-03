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

  it('keeps inventory filter icons on the shared close-button surface', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/ui/components/InventoryWindow/styles.module.scss',
      ),
      'utf8',
    );

    expect(source).toMatch(
      /\.filterIconButton\s*\{[\s\S]*?@include ui\.window-header-icon-button;/u,
    );
  });

  it('keeps recipe-book filter icons on the shared close-button surface', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/ui/components/RecipeBookWindow/styles.module.scss',
      ),
      'utf8',
    );

    expect(source).toMatch(
      /\.filterIconButton\s*\{[\s\S]*?@include ui\.window-header-icon-button;/u,
    );
  });

  it('keeps dropdown menu items transparent by default with angled corners', () => {
    const uiSource = readFileSync(
      resolve(process.cwd(), 'src/styles/_ui.scss'),
      'utf8',
    );
    const inventorySource = readFileSync(
      resolve(
        process.cwd(),
        'src/ui/components/InventoryWindow/styles.module.scss',
      ),
      'utf8',
    );
    const logSource = readFileSync(
      resolve(process.cwd(), 'src/ui/components/LogWindow/styles.module.scss'),
      'utf8',
    );

    expect(uiSource).toMatch(
      /@mixin menu-item-surface(?:\([^)]*\))?\s*\{[\s\S]*?\bbackground:\s*transparent;[\s\S]*?\bborder-color:\s*transparent;[\s\S]*?\bborder-radius:\s*\$ability-radius;/u,
    );
    expect(inventorySource).toMatch(
      /\.sortOption\s*\{[\s\S]*?@include ui\.menu-item-surface;/u,
    );
    expect(logSource).toMatch(
      /\.filterChip\s*\{[\s\S]*?@include ui\.menu-item-surface;/u,
    );
  });
});
