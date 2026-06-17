import type { HistoryEntry, SessionReport } from '../types';

const STORAGE_KEY = 'ghost_break_history';
const MAX_ENTRIES = 200;
const STORAGE_VERSION = 1;

interface StoreSchema {
  version: number;
  entries: HistoryEntry[];
}

function readStore(): StoreSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, entries: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { version: STORAGE_VERSION, entries: parsed };
    }
    if (parsed && typeof parsed === 'object' && 'version' in parsed) {
      return parsed as StoreSchema;
    }
    return { version: STORAGE_VERSION, entries: [] };
  } catch {
    return { version: STORAGE_VERSION, entries: [] };
  }
}

function writeStore(entries: HistoryEntry[]): boolean {
  try {
    const payload: StoreSchema = {
      version: STORAGE_VERSION,
      entries,
    };
    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      const pruned = entries.slice(0, Math.floor(MAX_ENTRIES / 2));
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ version: STORAGE_VERSION, entries: pruned }),
        );
      } catch {
        /* storage full — caller must handle */
      }
    }
    return false;
  }
}

export function loadHistory(): HistoryEntry[] {
  return readStore().entries;
}

export function saveReport(report: SessionReport): boolean {
  const store = readStore();
  store.entries.unshift(report as HistoryEntry);
  if (store.entries.length > MAX_ENTRIES) {
    store.entries = store.entries.slice(0, MAX_ENTRIES);
  }
  return writeStore(store.entries);
}

export function getReport(id: string): SessionReport | null {
  const store = readStore();
  return store.entries.find(r => r.id === id) ?? null;
}

export function deleteReport(id: string): boolean {
  const store = readStore();
  const filtered = store.entries.filter(r => r.id !== id);
  if (filtered.length === store.entries.length) return false;
  return writeStore(filtered);
}

export function clearHistory(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function entryCount(): number {
  return readStore().entries.length;
}
