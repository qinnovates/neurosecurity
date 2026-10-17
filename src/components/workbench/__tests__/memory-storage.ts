/**
 * A working `localStorage` for tests. Recent Node versions define their own `localStorage`
 * global, which shadows jsdom's and has no methods unless Node is given a file to back it.
 */
export function createMemoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() { return items.size; },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => { items.delete(key); },
    setItem: (key, value) => { items.set(key, String(value)); },
  };
}

/** Replaces `window.localStorage` for the current test file. Call from `beforeEach` to start each test empty. */
export function installMemoryLocalStorage(storage: Storage = createMemoryStorage()): Storage {
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  return storage;
}
