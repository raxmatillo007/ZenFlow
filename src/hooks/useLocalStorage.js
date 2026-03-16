import { ref } from 'vue';

const sharedStore = new Map();
const listenerKeys = new Set();

function readFromStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorage(key, initialValue) {
  if (!sharedStore.has(key)) {
    sharedStore.set(key, ref(readFromStorage(key, initialValue)));
  }

  const storedValue = sharedStore.get(key);

  const setValue = (value) => {
    const nextValue = value instanceof Function ? value(storedValue.value) : value;
    storedValue.value = nextValue;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(nextValue));
    }
  };

  if (typeof window !== 'undefined' && !listenerKeys.has(key)) {
    window.addEventListener('storage', (event) => {
      if (event.key !== key) return;
      storedValue.value = readFromStorage(key, initialValue);
    });
    listenerKeys.add(key);
  }

  return [storedValue, setValue];
}
