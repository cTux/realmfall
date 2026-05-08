const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 8443;
const DEFAULT_WS_PORT = 8080;

export type ChatRuntimeConfig = {
  googleClientId: string | null;
  host: string;
  port: number;
  wsPort: number;
};

export type ChatListenUrlOptions = {
  host: string;
  https?: boolean;
  port: number;
};

export type ChatWebSocketUrlOptions = {
  host: string;
  port: number;
  secure?: boolean;
};

export function createChatRuntimeConfig(
  environment = process.env,
): ChatRuntimeConfig {
  return {
    googleClientId: environment.REALMFALL_AUTH_GOOGLE_CLIENT_ID || null,
    host: environment.HOST || DEFAULT_HOST,
    port: Number.parseInt(environment.PORT ?? '', 10) || DEFAULT_PORT,
    wsPort: Number.parseInt(environment.WS_PORT ?? '', 10) || DEFAULT_WS_PORT,
  };
}

export function createChatListenUrl({
  host,
  https = false,
  port,
}: ChatListenUrlOptions) {
  return `${https ? 'https' : 'http'}://${host}:${port}`;
}

export function createChatWebSocketUrl({
  host,
  port,
  secure = false,
}: ChatWebSocketUrlOptions) {
  return `${secure ? 'wss' : 'ws'}://${host}:${port}`;
}
