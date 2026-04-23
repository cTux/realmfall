import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Pixi runtime imports', () => {
  it('does not register disabled filter extensions on the world bootstrap path', () => {
    const runtimeSource = readFileSync(
      join(process.cwd(), 'src/ui/world/pixiRuntime.ts'),
      'utf8',
    );

    expect(runtimeSource).not.toContain("import 'pixi.js/filters'");
  });
});
