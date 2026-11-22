import { useSyncExternalStore } from 'react';

// A tiny persisted store for a signed-in session (token + profile).
// remember=true keeps it in localStorage (survives restarts, shared across tabs);
// remember=false keeps it in sessionStorage (this tab only, gone when the browser closes).
export const createSessionStore = <T extends { token: string }>(storageKey: string) => {
  const listeners = new Set<() => void>();

  const read = (): T | null => {
    try {
      const raw = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  let current = read();
  let remember = localStorage.getItem(storageKey) !== null || sessionStorage.getItem(storageKey) === null;

  const emit = () => listeners.forEach(listener => listener());

  const set = (value: T | null, options?: { remember?: boolean }) => {
    if (options?.remember !== undefined) remember = options.remember;
    current = value;
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
    if (value) (remember ? localStorage : sessionStorage).setItem(storageKey, JSON.stringify(value));
    emit();
  };

  window.addEventListener('storage', event => {
    if (event.key === storageKey) {
      current = read();
      emit();
    }
  });

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    get: () => current,
    token: () => current?.token ?? null,
    set,
    update: (patch: Partial<T>) => current && set({ ...current, ...patch }),
    clear: () => set(null),
    use: () => useSyncExternalStore(subscribe, () => current),
  };
};
