/**
 * IndexedDB Service via idb
 * Stores Settings, Bookmarks, Play History, and Download Metadata.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { APP_CONFIG } from '@/config';
import { Bookmark, DownloadTask, PlayHistory, AppSettings, Ayah, ReadingHistoryItem } from '@/types';

interface QuranAudioDB extends DBSchema {
  settings: {
    key: string;
    value: any;
  };
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: { 'by-surah': number; 'by-created': number };
  };
  history: {
    key: number; // surahId
    value: PlayHistory;
    indexes: { 'by-last-played': number };
  };
  downloads: {
    key: number; // surahId
    value: DownloadTask;
    indexes: { 'by-status': string; 'by-updated': number };
  };
  translations: {
    key: number; // surahId
    value: {
      surahId: number;
      ayahs: Ayah[];
      cachedAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<QuranAudioDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<QuranAudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<QuranAudioDB>(APP_CONFIG.dbName, APP_CONFIG.dbVersion, {
      upgrade(db) {
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarkStore.createIndex('by-surah', 'surahId');
          bookmarkStore.createIndex('by-created', 'createdAt');
        }

        // History store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'surahId' });
          historyStore.createIndex('by-last-played', 'lastPlayedAt');
        }

        // Downloads metadata store
        if (!db.objectStoreNames.contains('downloads')) {
          const downloadStore = db.createObjectStore('downloads', { keyPath: 'surahId' });
          downloadStore.createIndex('by-status', 'status');
          downloadStore.createIndex('by-updated', 'updatedAt');
        }

        // Translations text store (for offline Arabic + Malayalam reading)
        if (!db.objectStoreNames.contains('translations')) {
          db.createObjectStore('translations', { keyPath: 'surahId' });
        }
      }
    });
  }
  return dbPromise;
}

// ---------------- Settings API ----------------
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    const val = await db.get('settings', key);
    return val !== undefined ? val : defaultValue;
  } catch (e) {
    console.error(`Error reading setting ${key}:`, e);
    return defaultValue;
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', value, key);
  } catch (e) {
    console.error(`Error saving setting ${key}:`, e);
  }
}

// ---------------- Bookmarks API ----------------
export async function getAllBookmarks(): Promise<Bookmark[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('bookmarks', 'by-created');
  } catch (e) {
    console.error('Error getting bookmarks:', e);
    return [];
  }
}

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  await db.put('bookmarks', bookmark);
}

export async function removeBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
}

export async function isBookmarked(surahId: number, ayahNumber?: number): Promise<boolean> {
  const db = await getDB();
  const id = ayahNumber ? `ayah-${surahId}-${ayahNumber}` : `surah-${surahId}`;
  const found = await db.get('bookmarks', id);
  return !!found;
}

// ---------------- History API ----------------
export async function getPlayHistory(): Promise<PlayHistory[]> {
  try {
    const db = await getDB();
    const list = await db.getAllFromIndex('history', 'by-last-played');
    return list.reverse(); // Most recent first
  } catch (e) {
    console.error('Error getting history:', e);
    return [];
  }
}

export async function getSurahHistory(surahId: number): Promise<PlayHistory | undefined> {
  try {
    const db = await getDB();
    return await db.get('history', surahId);
  } catch (e) {
    return undefined;
  }
}

export async function savePlayHistory(history: PlayHistory): Promise<void> {
  try {
    const db = await getDB();
    await db.put('history', history);
  } catch (e) {
    console.error('Error saving play history:', e);
  }
}

// ---------------- Downloads Metadata API ----------------
export async function getAllDownloads(): Promise<DownloadTask[]> {
  try {
    const db = await getDB();
    return await db.getAll('downloads');
  } catch (e) {
    console.error('Error getting downloads:', e);
    return [];
  }
}

export async function getDownload(surahId: number): Promise<DownloadTask | undefined> {
  try {
    const db = await getDB();
    return await db.get('downloads', surahId);
  } catch (e) {
    return undefined;
  }
}

export async function saveDownload(task: DownloadTask): Promise<void> {
  try {
    const db = await getDB();
    await db.put('downloads', task);
  } catch (e) {
    console.error('Error saving download task:', e);
  }
}

export async function deleteDownloadMeta(surahId: number): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('downloads', surahId);
  } catch (e) {
    console.error('Error deleting download meta:', e);
  }
}

export async function clearAllDownloadsMeta(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('downloads');
  } catch (e) {
    console.error('Error clearing downloads meta:', e);
  }
}

// ---------------- Translations Cache API ----------------
export async function getCachedTranslation(surahId: number): Promise<any | null> {
  try {
    const db = await getDB();
    const entry = await db.get('translations', surahId);
    return entry ? entry.ayahs : null;
  } catch (e) {
    return null;
  }
}

export async function saveCachedTranslation(surahId: number, ayahs: any[]): Promise<void> {
  try {
    const db = await getDB();
    await db.put('translations', {
      surahId,
      ayahs,
      cachedAt: Date.now()
    });
  } catch (e) {
    console.error('Error saving translation to cache:', e);
  }
}

// ---------------- Reading History API (Recent 10 Surahs with exact Ayah) ----------------
const READING_HISTORY_KEY = 'recent_reading_history_v1';

export async function getReadingHistory(): Promise<ReadingHistoryItem[]> {
  try {
    const items = await getSetting<ReadingHistoryItem[]>(READING_HISTORY_KEY, []);
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.error('Error reading history:', e);
    return [];
  }
}

export async function saveReadingHistory(item: ReadingHistoryItem): Promise<void> {
  try {
    const current = await getReadingHistory();
    // Filter out existing record for this surah so it moves to top with latest ayah
    const filtered = current.filter(h => h.surahId !== item.surahId);
    const updated = [item, ...filtered].slice(0, 10); // Keep max 10 entries
    await saveSetting(READING_HISTORY_KEY, updated);
  } catch (e) {
    console.error('Error saving reading history:', e);
  }
}

export async function deleteReadingHistoryItem(surahId: number): Promise<void> {
  try {
    const current = await getReadingHistory();
    const filtered = current.filter(h => h.surahId !== surahId);
    await saveSetting(READING_HISTORY_KEY, filtered);
  } catch (e) {
    console.error('Error removing reading history item:', e);
  }
}
