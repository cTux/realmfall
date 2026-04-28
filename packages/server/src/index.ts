import { buildServer } from './app.js';

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '127.0.0.1';

async function start() {
  const server = buildServer();
  const port = Number.parseInt(process.env.PORT ?? '', 10) || DEFAULT_PORT;
  const host = process.env.HOST || DEFAULT_HOST;

  try {
    await server.listen({ host, port });
    server.log.info(`Realmfall server listening on http://${host}:${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void start();
