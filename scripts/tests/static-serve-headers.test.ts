import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface ServeHeader {
  key: string;
  value: string;
}

interface ServeHeaderRule {
  source: string;
  headers: ServeHeader[];
}

interface ServeConfig {
  headers: ServeHeaderRule[];
}

describe('static serve headers', () => {
  it('caches Vite hashed assets as immutable browser resources', () => {
    const serveConfig = JSON.parse(
      readFileSync(join(process.cwd(), 'serve.json'), 'utf8'),
    ) as ServeConfig;
    const assetHeaders = getHeadersForSource(serveConfig, 'assets/**');

    expect(assetHeaders['Cache-Control']).toBe(
      'public, max-age=31536000, immutable',
    );
  });

  it('keeps mutable entry metadata revalidatable', () => {
    const serveConfig = JSON.parse(
      readFileSync(join(process.cwd(), 'serve.json'), 'utf8'),
    ) as ServeConfig;

    expect(getHeadersForSource(serveConfig, '**/*.html')['Cache-Control']).toBe(
      'no-cache',
    );
    expect(
      getHeadersForSource(serveConfig, 'version.json')['Cache-Control'],
    ).toBe('no-cache');
  });
});

function getHeadersForSource(config: ServeConfig, source: string) {
  const rule = config.headers.find((entry) => entry.source === source);

  return Object.fromEntries(
    rule?.headers.map((header) => [header.key, header.value]) ?? [],
  );
}
