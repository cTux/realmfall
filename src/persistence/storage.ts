const STORAGE_KEY = 'game-state';
const STORAGE_DATABASE_NAME = 'realmfall';
const STORAGE_DATABASE_VERSION = 1;
const STORAGE_OBJECT_STORE_NAME = 'app-state';
const PASSPHRASE = 'survival-rpg-local-save-v1';

// This passphrase-derived wrapper only obscures local saves in client storage.
// It is not a real security boundary because the key material ships with the app.

export interface PersistedData {
  game: unknown;
  ui: unknown;
}

export const PERSISTED_SAVE_STORAGE_KEY = STORAGE_KEY;

export async function loadEncryptedState(): Promise<PersistedData | null> {
  const payload = await loadPersistedPayload();
  if (!payload) return null;

  try {
    return await decryptJson<PersistedData>(payload);
  } catch {
    return null;
  }
}

export async function saveEncryptedState(data: PersistedData) {
  const payload = await encryptJson(data);
  await writePersistedPayload(payload);
}

export async function clearEncryptedState() {
  await clearPersistedPayload();
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

async function loadPersistedPayload() {
  const database = await openStorageDatabase();
  if (database) {
    try {
      const payload = await readIndexedDbPayload(database);
      if (payload) {
        return payload;
      }
    } catch {
      return loadLocalStoragePayload();
    }
  }

  const legacyPayload = loadLocalStoragePayload();
  if (legacyPayload && database) {
    try {
      await writeIndexedDbPayload(database, legacyPayload);
      clearLocalStoragePayload();
    } catch {
      return legacyPayload;
    }
  }

  return legacyPayload;
}

async function writePersistedPayload(payload: string) {
  const database = await openStorageDatabase();
  if (database) {
    await writeIndexedDbPayload(database, payload);
    clearLocalStoragePayload();
    return;
  }

  writeLocalStoragePayload(payload);
}

async function clearPersistedPayload() {
  const database = await openStorageDatabase();
  if (database) {
    await deleteIndexedDbPayload(database);
  }

  clearLocalStoragePayload();
}

async function openStorageDatabase() {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

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
      };
      resolve(database);
    };
    request.onerror = () => {
      resolve(null);
    };
    request.onblocked = () => {
      resolve(null);
    };
  });
}

async function readIndexedDbPayload(database: IDBDatabase) {
  return new Promise<string | null>((resolve, reject) => {
    const transaction = database.transaction(
      STORAGE_OBJECT_STORE_NAME,
      'readonly',
    );
    const request = transaction.objectStore(STORAGE_OBJECT_STORE_NAME).get(
      STORAGE_KEY,
    );

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

async function writeIndexedDbPayload(database: IDBDatabase, payload: string) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      STORAGE_OBJECT_STORE_NAME,
      'readwrite',
    );

    transaction.objectStore(STORAGE_OBJECT_STORE_NAME).put(payload, STORAGE_KEY);
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

async function deleteIndexedDbPayload(database: IDBDatabase) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      STORAGE_OBJECT_STORE_NAME,
      'readwrite',
    );

    transaction.objectStore(STORAGE_OBJECT_STORE_NAME).delete(STORAGE_KEY);
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

function loadLocalStoragePayload() {
  return localStorage.getItem(STORAGE_KEY);
}

function writeLocalStoragePayload(payload: string) {
  localStorage.setItem(STORAGE_KEY, payload);
}

function clearLocalStoragePayload() {
  localStorage.removeItem(STORAGE_KEY);
}
