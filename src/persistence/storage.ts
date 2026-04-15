const STORAGE_KEY = 'game-state';
const LEGACY_STORAGE_KEY = 'survival-rpg-save';
const PASSPHRASE = 'survival-rpg-local-save-v1';

// This passphrase-derived wrapper only obscures local saves in client storage.
// It is not a real security boundary because the key material ships with the app.

export interface PersistedData {
  game: unknown;
  ui: unknown;
}

export const PERSISTED_SAVE_STORAGE_KEY = STORAGE_KEY;

export async function loadEncryptedState(): Promise<PersistedData | null> {
  const payload = getStoredPayload();
  if (!payload) return null;

  try {
    const decrypted = await decryptJson<PersistedData>(payload);
    migrateLegacyPayload(payload);
    return decrypted;
  } catch {
    return null;
  }
}

export async function saveEncryptedState(data: PersistedData) {
  const payload = await encryptJson(data);
  localStorage.setItem(STORAGE_KEY, payload);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function clearEncryptedState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function getStoredPayload() {
  return (
    localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem(LEGACY_STORAGE_KEY)
  );
}

function migrateLegacyPayload(payload: string) {
  if (
    localStorage.getItem(STORAGE_KEY) ||
    !localStorage.getItem(LEGACY_STORAGE_KEY)
  ) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, payload);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
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
