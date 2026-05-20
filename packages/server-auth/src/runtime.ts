import process from 'node:process';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3002;

const REALM_STATUSES = ['maintenance', 'offline', 'online'] as const;

export type RealmDirectoryStatus = (typeof REALM_STATUSES)[number];

export type RealmDirectoryEntry = {
  id: string;
  name: string;
  status: RealmDirectoryStatus;
  worldServerUrl: string;
};

type AuthListenUrlOptions = {
  host: string;
  https?: boolean;
  port: number;
};

export type AuthRuntimeConfig = {
  googleClientId: string | null;
  host: string;
  port: number;
  realms: RealmDirectoryEntry[];
};

export const DEFAULT_REALM_DIRECTORY: RealmDirectoryEntry[] = [
  {
    id: 'local',
    name: 'Local Realm',
    status: 'online',
    worldServerUrl: 'https://localhost:3001',
  },
];

function isRealmDirectoryStatus(
  status: unknown,
): status is RealmDirectoryStatus {
  return (
    typeof status === 'string' &&
    REALM_STATUSES.includes(status as RealmDirectoryStatus)
  );
}

function parseRealmDirectoryEntry(
  value: unknown,
  index: number,
): RealmDirectoryEntry {
  if (!value || typeof value !== 'object') {
    throw new Error(
      `Expected REALMFALL_AUTH_REALMS_JSON[${index}] to be an object.`,
    );
  }

  const realm = value as Partial<RealmDirectoryEntry>;

  if (typeof realm.id !== 'string' || realm.id.length === 0) {
    throw new Error(
      `Expected REALMFALL_AUTH_REALMS_JSON[${index}].id to be a non-empty string.`,
    );
  }

  if (typeof realm.name !== 'string' || realm.name.length === 0) {
    throw new Error(
      `Expected REALMFALL_AUTH_REALMS_JSON[${index}].name to be a non-empty string.`,
    );
  }

  if (!isRealmDirectoryStatus(realm.status)) {
    throw new Error(
      `Expected REALMFALL_AUTH_REALMS_JSON[${index}].status to be one of ${REALM_STATUSES.join(', ')}.`,
    );
  }

  if (
    typeof realm.worldServerUrl !== 'string' ||
    realm.worldServerUrl.length === 0
  ) {
    throw new Error(
      `Expected REALMFALL_AUTH_REALMS_JSON[${index}].worldServerUrl to be a non-empty string.`,
    );
  }

  return {
    id: realm.id,
    name: realm.name,
    status: realm.status,
    worldServerUrl: realm.worldServerUrl,
  };
}

export function parseRealmDirectory(
  rawRealmDirectory = process.env.REALMFALL_AUTH_REALMS_JSON,
): RealmDirectoryEntry[] {
  if (!rawRealmDirectory) {
    return DEFAULT_REALM_DIRECTORY.map((realm) => ({ ...realm }));
  }

  const parsedValue = JSON.parse(rawRealmDirectory) as unknown;

  if (!Array.isArray(parsedValue)) {
    throw new Error('Expected REALMFALL_AUTH_REALMS_JSON to be a JSON array.');
  }

  return parsedValue.map((entry, index) =>
    parseRealmDirectoryEntry(entry, index),
  );
}

export function createAuthRuntimeConfig(
  environment = process.env,
): AuthRuntimeConfig {
  return {
    googleClientId: environment.REALMFALL_AUTH_GOOGLE_CLIENT_ID || null,
    host: environment.HOST || DEFAULT_HOST,
    port: Number.parseInt(environment.PORT ?? '', 10) || DEFAULT_PORT,
    realms: parseRealmDirectory(environment.REALMFALL_AUTH_REALMS_JSON),
  };
}

export function createAuthListenUrl({
  host,
  https = false,
  port,
}: AuthListenUrlOptions) {
  return `${https ? 'https' : 'http'}://${host}:${port}`;
}
