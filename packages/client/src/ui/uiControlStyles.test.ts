import { readFileSync } from 'node:fs';
import { readUiStylesSource } from './uiControlStylesTestkit';

describe('shared compact control chip styles', () => {
  it('does not force a fixed width on label-sized controls', () => {
    const source = readUiStylesSource(readFileSync);
    const mixinBody = source.match(
      /@mixin compact-control-chip\([^)]*\)\s*\{(?<body>[\s\S]*?)\n\}/u,
    )?.groups?.body;

    expect(mixinBody).toBeDefined();
    expect(mixinBody).not.toMatch(/\bwidth\s*:/u);
  });
});
