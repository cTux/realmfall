import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Pixi runtime imports', () => {
  it('does not register disabled filter extensions on the world bootstrap path', () => {
    const runtimeSource = readFileSync(
      join(process.cwd(), 'packages/client/src/ui/world/pixiRuntime.ts'),
      'utf8',
    );

    expect(runtimeSource).not.toContain("import 'pixi.js/filters'");
  });

  it('keeps world render-loop modules behind the async Pixi bootstrap', () => {
    const hookSource = readFileSync(
      join(process.cwd(), 'packages/client/src/app/App/usePixiWorld.ts'),
      'utf8',
    );
    const valueImports = hookSource.match(
      /^import\s+(?!type\b)[\s\S]*?from\s+['"][^'"]+['"];?/gm,
    );

    expect(valueImports?.join('\n')).not.toContain(
      './world/pixiWorldRenderLoop',
    );
  });

  it('keeps direct async Pixi bootstrap imports out of usePixiWorld', () => {
    const hookSource = readFileSync(
      join(process.cwd(), 'packages/client/src/app/App/usePixiWorld.ts'),
      'utf8',
    );

    expect(hookSource).not.toContain("import('./world/pixiWorldCamera')");
    expect(hookSource).not.toContain("import('./world/pixiWorldInteractions')");
    expect(hookSource).not.toContain("import('./world/pixiWorldRenderLoop')");
    expect(hookSource).not.toContain("import('../../ui/world/pixiRuntime')");
  });

  it('does not pass expensive world defaults directly to useRef', () => {
    const hookSource = readFileSync(
      join(process.cwd(), 'packages/client/src/app/App/usePixiWorld.ts'),
      'utf8',
    );

    expect(hookSource).not.toContain('useRef(getVisibleTiles(game))');
    expect(hookSource).not.toContain(
      'useRef(new Map<string, WorldHoverSnapshot>())',
    );
    expect(hookSource).not.toContain('createWorldRenderSnapshot()');
  });
});
