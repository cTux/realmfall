import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

type StaticServerOptions = {
  distDir: string;
  port: number;
};

export type StaticServerHandle = {
  close: () => Promise<void>;
  origin: string;
};

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export async function startStaticServer({
  distDir,
  port,
}: StaticServerOptions): Promise<StaticServerHandle> {
  const server = createServer(async (request, response) => {
    const requestPath =
      request.url && request.url !== '/' ? request.url : '/index.html';
    const normalizedPath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(distDir, normalizedPath);

    if (!existsSync(filePath)) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }

    response.setHeader(
      'Content-Type',
      CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
    );
    createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolvePromise());
  });

  return {
    origin: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolvePromise, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolvePromise();
        });
      }),
  };
}
