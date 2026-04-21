describe('encrypted storage', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.stubGlobal('indexedDB', undefined);
  });

  it('round-trips persisted state through IndexedDB when available', async () => {
    const payload = {
      game: { turn: 7, player: { hp: 12 } },
      ui: {
        windows: { hero: { x: 10, y: 20, width: 420, height: 280 } },
        windowShown: { hero: true },
      },
    };
    const { records, indexedDB } = createIndexedDbMock();

    vi.stubGlobal('indexedDB', indexedDB);

    const { loadEncryptedState, saveEncryptedState } = await import('./storage');

    await saveEncryptedState(payload);

    const raw = records.get('game-state');
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('"turn":7');
    expect(localStorage.getItem('game-state')).toBeNull();

    await expect(loadEncryptedState()).resolves.toEqual(payload);
  });

  it('migrates the localStorage save into IndexedDB on first IndexedDB-backed load', async () => {
    const payload = {
      game: { turn: 12, player: { hp: 9 } },
      ui: { windowShown: { hero: false } },
    };

    {
      const { saveEncryptedState } = await import('./storage');
      await saveEncryptedState(payload);
    }

    const legacyPayload = localStorage.getItem('game-state');
    expect(legacyPayload).toBeTruthy();

    vi.resetModules();

    const { records, indexedDB } = createIndexedDbMock();
    vi.stubGlobal('indexedDB', indexedDB);

    const { loadEncryptedState } = await import('./storage');

    await expect(loadEncryptedState()).resolves.toEqual(payload);
    expect(records.get('game-state')).toBe(legacyPayload);
    expect(localStorage.getItem('game-state')).toBeNull();
  });

  it('returns null for missing or invalid payloads when IndexedDB is unavailable', async () => {
    const { loadEncryptedState } = await import('./storage');

    await expect(loadEncryptedState()).resolves.toBeNull();

    localStorage.setItem('game-state', 'not-json');
    await expect(loadEncryptedState()).resolves.toBeNull();
  });
});

function createIndexedDbMock() {
  const records = new Map<string, string>();
  let hasStore = false;

  const indexedDB = {
    open: vi.fn(() => {
      const request: MockOpenRequest = {
        error: null,
        onblocked: null,
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: undefined,
      };

      queueMicrotask(() => {
        const database = createMockDatabase({
          hasStore: () => hasStore,
          onCreateStore() {
            hasStore = true;
          },
          records,
        });

        request.result = database;

        if (!hasStore) {
          request.onupgradeneeded?.call(
            request as unknown as IDBOpenDBRequest,
            new Event('upgradeneeded') as IDBVersionChangeEvent,
          );
        }

        request.onsuccess?.call(
          request as unknown as IDBOpenDBRequest,
          new Event('success'),
        );
      });

      return request as IDBOpenDBRequest;
    }),
  } satisfies Pick<IDBFactory, 'open'>;

  return { indexedDB, records };
}

function createMockDatabase({
  hasStore,
  onCreateStore,
  records,
}: {
  hasStore: () => boolean;
  onCreateStore: () => void;
  records: Map<string, string>;
}) {
  return {
    close: vi.fn(),
    createObjectStore: vi.fn(() => {
      onCreateStore();
      return {};
    }),
    objectStoreNames: {
      contains: (name: string) => hasStore() && name === 'app-state',
    },
    onversionchange: null,
    transaction: vi.fn(() => createMockTransaction(records)),
  } as unknown as IDBDatabase;
}

function createMockTransaction(records: Map<string, string>) {
  const transaction: MockTransaction = {
    error: null,
    onabort: null,
    oncomplete: null,
    onerror: null,
  };

  transaction.objectStore = () =>
    ({
      delete: (key: IDBValidKey) =>
        queueIndexedDbRequest(() => {
          records.delete(String(key));
          queueMicrotask(() => {
            transaction.oncomplete?.call(
              transaction as unknown as IDBTransaction,
              new Event('complete'),
            );
          });
          return undefined;
        }),
      get: (key: IDBValidKey) =>
        queueIndexedDbRequest(() => records.get(String(key)) ?? undefined),
      put: (value: unknown, key: IDBValidKey) =>
        queueIndexedDbRequest(() => {
          records.set(String(key), String(value));
          queueMicrotask(() => {
            transaction.oncomplete?.call(
              transaction as unknown as IDBTransaction,
              new Event('complete'),
            );
          });
          return key;
        }),
    }) as IDBObjectStore;

  return transaction as unknown as IDBTransaction;
}

function queueIndexedDbRequest<T>(resolveValue: () => T) {
  const request: MockRequest<T> = {
    error: null,
    onerror: null,
    onsuccess: null,
    result: undefined,
  };

  queueMicrotask(() => {
    request.result = resolveValue();
    request.onsuccess?.call(
      request as unknown as IDBRequest<T>,
      new Event('success'),
    );
  });

  return request as IDBRequest<T>;
}

interface MockRequest<T> {
  error: DOMException | null;
  onerror: ((this: IDBRequest<T>, ev: Event) => unknown) | null;
  onsuccess: ((this: IDBRequest<T>, ev: Event) => unknown) | null;
  result: T | undefined;
}

interface MockOpenRequest extends MockRequest<IDBDatabase> {
  onblocked: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null;
  onupgradeneeded:
    | ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown)
    | null;
}

interface MockTransaction {
  error: DOMException | null;
  onabort: ((this: IDBTransaction, ev: Event) => unknown) | null;
  oncomplete: ((this: IDBTransaction, ev: Event) => unknown) | null;
  onerror: ((this: IDBTransaction, ev: Event) => unknown) | null;
  objectStore?: () => IDBObjectStore;
}
