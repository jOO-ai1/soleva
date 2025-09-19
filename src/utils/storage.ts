// Safe storage utilities to prevent runtime crashes due to
// unavailable storage or malformed JSON values.

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch {






































































    // ignore write errors (quota, privacy mode, etc.)
  }}export function safeRemoveItem(key: string): void {try {if (typeof window === 'undefined' || !window.localStorage) return;window.localStorage.removeItem(key);} catch {







    // ignore
  }}export function safeJSONParse<T>(value: string | null, fallback: T): T {if (value == null) return fallback;try {return JSON.parse(value) as T;} catch {return fallback;}}export function readJSON<T>(key: string, fallback: T): T {const raw = safeGetItem(key);return safeJSONParse<T>(raw, fallback);}