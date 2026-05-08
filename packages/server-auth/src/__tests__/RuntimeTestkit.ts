import { expect } from 'vitest';
import {
  createAuthListenUrl,
  createAuthRuntimeConfig,
  type RealmDirectoryEntry,
} from '../runtime.js';

const CUSTOM_REALMS: RealmDirectoryEntry[] = [
  {
    id: 'na-prod',
    name: 'North America',
    status: 'online',
    worldServerUrl: 'https://na.realmfall.example',
  },
];

export class AuthRuntimeTestkit {
  readonly expect = {
    defaultRuntimeConfigUsesLocalAuthDefaults: () => {
      expect(createAuthRuntimeConfig({})).toEqual({
        googleClientId: null,
        host: 'localhost',
        port: 3002,
        realms: [
          {
            id: 'local',
            name: 'Local Realm',
            status: 'online',
            worldServerUrl: 'https://localhost:3001',
          },
        ],
      });
    },
    listenUrlsMatchProtocol: () => {
      expect(
        createAuthListenUrl({
          host: 'localhost',
          port: 3002,
        }),
      ).toBe('http://localhost:3002');
      expect(
        createAuthListenUrl({
          host: 'localhost',
          https: true,
          port: 3002,
        }),
      ).toBe('https://localhost:3002');
    },
    runtimeConfigUsesProvidedOverrides: () => {
      expect(
        createAuthRuntimeConfig({
          HOST: '0.0.0.0',
          PORT: '4102',
          REALMFALL_AUTH_GOOGLE_CLIENT_ID: 'realmfall-web-client-id',
          REALMFALL_AUTH_REALMS_JSON: JSON.stringify(CUSTOM_REALMS),
        }),
      ).toEqual({
        googleClientId: 'realmfall-web-client-id',
        host: '0.0.0.0',
        port: 4102,
        realms: CUSTOM_REALMS,
      });
    },
  };
}
