import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('shared compact control chip styles', () => {
  it('does not force a fixed width on label-sized controls', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/styles/_ui.scss'),
      'utf8',
    );
    const mixinBody = source.match(
      /@mixin compact-control-chip\([^)]*\)\s*\{(?<body>[\s\S]*?)\n\}/u,
    )?.groups?.body;

    expect(mixinBody).toBeDefined();
    expect(mixinBody).not.toMatch(/\bwidth\s*:/u);
  });
});
