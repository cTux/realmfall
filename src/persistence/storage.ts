const STORAGE_KEY = 'survival-rpg-save';
const PASSPHRASE = 'survival-rpg-local-save-v1';

export interface PersistedData {
  game: unknown;
  ui: unknown;
}

export async function loadEncryptedState(): Promise<PersistedData | null> {
  const payload = localStorage.getItem(STORAGE_KEY);
  if (!payload) return null;

  try {
    return await decryptJson<PersistedData>(payload);
  } catch {
    return null;
  }
}

export async function saveEncryptedState(data: PersistedData) {
  const payload = await encryptJson(data);
  localStorage.setItem(STORAGE_KEY, payload);
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
