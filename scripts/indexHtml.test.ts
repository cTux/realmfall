import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('index.html favicon theme mapping', () => {
  it('uses contrast-first favicon assets for light and dark color schemes', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'index.html'),
      'utf8',
    ).replaceAll('\r\n', '\n');

    expect(html).toContain(
      'href="/src/assets/favicons/mace-head-dark.svg"\n      media="(prefers-color-scheme: light)"',
    );
    expect(html).toContain(
      'href="/src/assets/favicons/mace-head-light.svg"\n      media="(prefers-color-scheme: dark)"',
    );
  });
});
