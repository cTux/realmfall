import { expect } from 'vitest';
import {
  createServerListenUrl,
  createServerRuntimeConfig,
} from '../runtime.js';

export class ServerRuntimeTestkit {
  readonly expect = {
    defaultRuntimeConfigUsesLocalhost: () => {
      expect(createServerRuntimeConfig({})).toEqual({
        host: 'localhost',
        port: 3001,
      });
    },
    listenUrlsMatchProtocol: () => {
      expect(
        createServerListenUrl({
          host: 'localhost',
          port: 3001,
        }),
      ).toBe('http://localhost:3001');
      expect(
        createServerListenUrl({
          host: 'localhost',
          https: true,
          port: 3001,
        }),
      ).toBe('https://localhost:3001');
    },
    runtimeConfigUsesProvidedHostAndPort: () => {
      expect(
        createServerRuntimeConfig({
          HOST: '0.0.0.0',
          PORT: '4100',
        }),
      ).toEqual({
        host: '0.0.0.0',
        port: 4100,
      });
    },
  };
}
