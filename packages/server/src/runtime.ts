import process from 'node:process';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3001;

type ServerListenUrlOptions = {
  host: string;
  https?: boolean;
  port: number;
};

type ServerRuntimeConfig = {
  host: string;
  port: number;
};

export function createServerRuntimeConfig(
  environment = process.env,
): ServerRuntimeConfig {
  return {
    host: environment.HOST || DEFAULT_HOST,
    port: Number.parseInt(environment.PORT ?? '', 10) || DEFAULT_PORT,
  };
}

export function createServerListenUrl({
  host,
  https = false,
  port,
}: ServerListenUrlOptions) {
  return `${https ? 'https' : 'http'}://${host}:${port}`;
}
