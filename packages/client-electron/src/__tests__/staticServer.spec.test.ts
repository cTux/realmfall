import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer } from '../staticServer.js';

describe('startStaticServer', () => {
  it('serves the built client index and version payload over localhost', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'realmfall-electron-'));
    await writeFile(join(distDir, 'index.html'), '<html>shell</html>');
    await writeFile(join(distDir, 'version.json'), '{"version":"test"}');

    const server = await startStaticServer({
      distDir,
      port: 43110,
    });

    try {
      const indexResponse = await fetch('http://127.0.0.1:43110/index.html');
      const versionResponse = await fetch(
        'http://127.0.0.1:43110/version.json',
      );

      expect(await indexResponse.text()).toContain('shell');
      expect(await versionResponse.json()).toEqual({ version: 'test' });
    } finally {
      await server.close();
    }
  });
});
