import { expect } from 'vitest';
import {
  createChatListenUrl,
  createChatRuntimeConfig,
  createChatWebSocketUrl,
} from '../runtime.js';

export class ChatRuntimeTestkit {
  readonly expect = {
    defaultRuntimeConfigUsesChatDefaults: () => {
      expect(createChatRuntimeConfig({})).toEqual({
        googleClientId: null,
        host: 'localhost',
        port: 8443,
        wsPort: 8080,
      });
    },
    listenUrlsMatchProtocol: () => {
      expect(
        createChatListenUrl({
          host: 'localhost',
          port: 8443,
        }),
      ).toBe('http://localhost:8443');
      expect(
        createChatListenUrl({
          host: 'localhost',
          https: true,
          port: 8443,
        }),
      ).toBe('https://localhost:8443');
      expect(
        createChatWebSocketUrl({
          host: 'localhost',
          port: 8080,
        }),
      ).toBe('ws://localhost:8080');
      expect(
        createChatWebSocketUrl({
          host: 'localhost',
          port: 8080,
          secure: true,
        }),
      ).toBe('wss://localhost:8080');
    },
    runtimeConfigUsesProvidedOverrides: () => {
      expect(
        createChatRuntimeConfig({
          HOST: '0.0.0.0',
          PORT: '4103',
          REALMFALL_AUTH_GOOGLE_CLIENT_ID: 'realmfall-web-client-id',
          WS_PORT: '4104',
        }),
      ).toEqual({
        googleClientId: 'realmfall-web-client-id',
        host: '0.0.0.0',
        port: 4103,
        wsPort: 4104,
      });
    },
  };
}
