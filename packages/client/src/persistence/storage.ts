import { ENCRYPTED_SAVE_AREA_IDS, type EncryptedSaveAreaId } from './saveAreas';

const STORAGE_DATABASE_NAME = 'realmfall';
const STORAGE_DATABASE_VERSION = 1;
const STORAGE_OBJECT_STORE_NAME = 'app-state';
const PASSPHRASE = 'survival-rpg-local-save-v1';
const DUNGEON_STORAGE_KEY_PREFIX = 'game-state-dungeon-';
let storageDatabasePromise: Promise<IDBDatabase | null> | null = null;
let storageKeyPromise: Promise<CryptoKey> | null = null;

// This passphrase-derived wrapper only obscures local saves in client storage.
// It is not a real security boundary because the key material ships with the app.

export type PersistedData = Partial<Record<EncryptedSaveAreaId, unknown>>;

export const PERSISTED_SAVE_STORAGE_KEYS = {
  game: 'game-state-game',
  ui: 'game-state-ui',
} satisfies Record<EncryptedSaveAreaId, string>;

export function getDungeonSaveStorageKey(dungeonId: string) {
  return `${DUNGEON_STORAGE_KEY_PREFIX}${dungeonId}`;
}

export async function loadEncryptedState(): Promise<PersistedData | null> {
  const database = await openStorageDatabase();
  const entries = await Promise.all(
    ENCRYPTED_SAVE_AREA_IDS.map(async (areaId) => {
      const payload = await loadPersistedPayload(areaId, database);
      if (!payload) {
        return null;
      }

      try {
        return [areaId, await decryptJson(payload)] as const;
      } catch {
        return null;
      }
    }),
  );
  const loaded = Object.fromEntries(
    entries.filter((entry) => entry !== null),
  ) as PersistedData;

  return Object.keys(loaded).length > 0 ? loaded : null;
}

export async function loadEncryptedDungeonState<T>(
  dungeonId: string,
): Promise<T | null> {
  const database = await openStorageDatabase();
  const payload = await loadPersistedPayloadByKey(
    getDungeonSaveStorageKey(dungeonId),
    database,
  );
  if (!payload) {
    return null;
  }

  try {
    return await decryptJson<T>(payload);
  } catch {
    return null;
  }
}

export async function saveEncryptedState(data: PersistedData) {
  const database = await openStorageDatabase();

  await Promise.all(
    ENCRYPTED_SAVE_AREA_IDS.map(async (areaId) => {
      const areaData = data[areaId];
      if (areaData === undefined) {
        return;
      }

      const payload = await encryptJson(areaData);
      await writePersistedPayload(areaId, payload, database);
    }),
  );
}

export async function saveEncryptedDungeonState(
  dungeonId: string,
  data: unknown,
) {
  const database = await openStorageDatabase();
  const payload = await encryptJson(data);

  await writePersistedPayloadByKey(
    getDungeonSaveStorageKey(dungeonId),
    payload,
    database,
  );
}

export async function clearEncryptedState(areaId?: EncryptedSaveAreaId) {
  const database = await openStorageDatabase();
  const areas = areaId ? [areaId] : ENCRYPTED_SAVE_AREA_IDS;

  await Promise.all(
    areas.map((currentAreaId) =>
      clearPersistedPayload(currentAreaId, database),
    ),
  );
}

export async function clearEncryptedDungeonStates() {
  const database = await openStorageDatabase();
  await clearPersistedPayloadsByPrefix(DUNGEON_STORAGE_KEY_PREFIX, database);
}

function getStorageKey(areaId: EncryptedSaveAreaId) {
  return PERSISTED_SAVE_STORAGE_KEYS[areaId];
}

async function encryptJson(value: unknown) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  return JSON.stringify({
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  });
}

async function decryptJson<T>(payload: string) {
  const parsed = JSON.parse(payload) as { iv: string; data: string };
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(parsed.iv) },
    key,
    fromBase64(parsed.data),
  );

  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}

async function getKey() {
  storageKeyPromise ??= deriveStorageKey().catch((error: unknown) => {
    storageKeyPromise = null;
    throw error;
  });

  return storageKeyPromise;
}

async function deriveStorageKey() {
  const passphrase = new TextEncoder().encode(PASSPHRASE);
  const digest = await crypto.subtle.digest('SHA-256', passphrase);
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function loadPersistedPayload(
  areaId: EncryptedSaveAreaId,
  database: IDBDatabase | null,
) {
  return loadPersistedPayloadByKey(getStorageKey(areaId), database);
}

async function loadPersistedPayloadByKey(
  storageKey: string,
  database: IDBDatabase | null,
) {
  if (database) {
    try {
      const payload = await readIndexedDbPayloadByKey(database, storageKey);
      if (payload) {
        return payload;
      }
    } catch {
      return loadLocalStoragePayloadByKey(storageKey);
    }
  }

  const legacyPayload = loadLocalStoragePayloadByKey(storageKey);
  if (legacyPayload && database) {
    try {
      await writeIndexedDbPayloadByKey(database, storageKey, legacyPayload);
      clearLocalStoragePayloadByKey(storageKey);
    } catch {
      return legacyPayload;
    }
  }

  return legacyPayload;
}

async function writePersistedPayload(
  areaId: EncryptedSaveAreaId,
  payload: string,
  database: IDBDatabase | null,
) {
  await writePersistedPayloadByKey(getStorageKey(areaId), payload, database);
}

async function writePersistedPayloadByKey(
  storageKey: string,
  payload: string,
  database: IDBDatabase | null,
) {
  if (database) {
    await writeIndexedDbPayloadByKey(database, storageKey, payload);
    clearLocalStoragePayloadByKey(storageKey);
    return;
  }

  writeLocalStoragePayloadByKey(storageKey, payload);
}

async function clearPersistedPayload(
  areaId: EncryptedSaveAreaId,
  database: IDBDatabase | null,
) {
  await clearPersistedPayloadByKey(getStorageKey(areaId), database);
}

async function clearPersistedPayloadByKey(
  storageKey: string,
  database: IDBDatabase | null,
) {
  if (database) {
    await deleteIndexedDbPayloadByKey(database, storageKey);
  }

  clearLocalStoragePayloadByKey(storageKey);
}

async function clearPersistedPayloadsByPrefix(
  storageKeyPrefix: string,
  database: IDBDatabase | null,
) {
  try {
    if (database) {
      const storageKeys = await readIndexedDbKeysByPrefix(
        database,
        storageKeyPrefix,
      );
      await Promise.all(
        storageKeys.map((storageKey) =>
          deleteIndexedDbPayloadByKey(database, storageKey),
        ),
      );
    }
  } finally {
    clearLocalStoragePayloadsByPrefix(storageKeyPrefix);
  }
}

async function openStorageDatabase() {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  storageDatabasePromise ??= openIndexedDbStorageDatabase();

  return storageDatabasePromise;
}

async function openIndexedDbStorageDatabase() {
  return new Promise<IDBDatabase | null>((resolve) => {
    const request = indexedDB.open(
      STORAGE_DATABASE_NAME,
      STORAGE_DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORAGE_OBJECT_STORE_NAME)) {
        database.createObjectStore(STORAGE_OBJECT_STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        storageDatabasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => {
      storageDatabasePromise = null;
      resolve(null);
    };
    request.onblocked = () => {
      storageDatabasePromise = null;
      resolve(null);
    };
  });
}

async function readIndexedDbPayloadByKey(
  database: IDBDatabase,
  storageKey: string,
) {
  return new Promise<string | null>((resolve, reject) => {
    const transaction = database.transaction(
      STORAGE_OBJECT_STORE_NAME,
      'readonly',
    );
    const request = transaction
      .objectStore(STORAGE_OBJECT_STORE_NAME)
      .get(storageKey);

    request.onsuccess = () => {
      resolve(typeof request.result === 'string' ? request.result : null);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('Failed to read persisted save.'));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to read persisted save.'));
    };
  });
}

async function readIndexedDbKeysByPrefix(
  database: IDBDatabase,
  storageKeyPrefix: string,
) {
  return new Promise<string[]>((resolve, reject) => {
    const transaction = database.transaction(
      STORAGE_OBJECT_STORE_NAME,
      'readonly',
    );
    const request = transaction
      .objectStore(STORAGE_OBJECT_STORE_NAME)
      .getAllKeys();

    request.onsuccess = () => {
      const keys = Array.isArray(request.result)
        ? request.result.map(String)
        : [];
      resolve(keys.filter((key) => key.startsWith(storageKeyPrefix)));
    };
    request.onerror = () => {
      reject(request.error ?? new Error('Failed to read persisted save.'));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to read persisted save.'));
    };
  });
}

async function writeIndexedDbPayloadByKey(
  database: IDBDatabase,
  storageKey: string,
  payload: string,
) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      STORAGE_OBJECT_STORE_NAME,
      'readwrite',
    );

    transaction.objectStore(STORAGE_OBJECT_STORE_NAME).put(payload, storageKey);
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to write persisted save.'));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('Failed to write persisted save.'));
    };
  });
}

async function deleteIndexedDbPayloadByKey(
  database: IDBDatabase,
  storageKey: string,
) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      STORAGE_OBJECT_STORE_NAME,
      'readwrite',
    );

    transaction.objectStore(STORAGE_OBJECT_STORE_NAME).delete(storageKey);
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to clear persisted save.'));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('Failed to clear persisted save.'));
    };
  });
}

function loadLocalStoragePayloadByKey(storageKey: string) {
  return localStorage.getItem(storageKey);
}

function writeLocalStoragePayloadByKey(storageKey: string, payload: string) {
  localStorage.setItem(storageKey, payload);
}

function clearLocalStoragePayloadByKey(storageKey: string) {
  localStorage.removeItem(storageKey);
}

function clearLocalStoragePayloadsByPrefix(storageKeyPrefix: string) {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const storageKey = localStorage.key(index);
    if (storageKey?.startsWith(storageKeyPrefix)) {
      localStorage.removeItem(storageKey);
    }
  }
}
