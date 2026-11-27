/**
 * Translation & Scripture Service
 * 
 * Provides chapter-level Arabic (Uthmani) text paired with authentic
 * Malayalam translation (Cheriyamundam Abdul Hameed & Kunhi Mohammed Parappoor).
 * 
 * Features:
 * - IndexedDB permanent caching (works 100% offline once opened)
 * - Bundled JSON fallback
 * - High-speed open API fallback (api.alquran.cloud)
 */

import { Ayah } from '@/types';
import { getCachedTranslation, saveCachedTranslation } from './db';

export async function loadSurahAyahs(surahId: number): Promise<Ayah[]> {
  // 1. Check IndexedDB offline cache
  const cached = await getCachedTranslation(surahId);
  if (cached && cached.length > 0) {
    return cached;
  }

  // 2. Check local bundled static translations
  try {
    const res = await fetch(`/data/translations/${surahId}.json`);
    if (res.ok) {
      const data: Ayah[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        await saveCachedTranslation(surahId, data);
        return data;
      }
    }
  } catch (e) {
    // Continue to network fetch
  }

  // 3. High-speed dynamic fetch from open Quran CDN API (with 6s timeout for low-network resilience)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const apiUrl = `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,ml.abdulhameed`;
    const res = await fetch(apiUrl, { cache: 'force-cache', signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
        const arabicData = json.data[0].ayahs;
        const malayalamData = json.data[1].ayahs;

        const pairedAyahs: Ayah[] = arabicData.map((arItem: any, idx: number) => {
          const mlItem = malayalamData[idx] || {};
          return {
            ayah: arItem.numberInSurah,
            arabic: arItem.text,
            malayalam: mlItem.text || '',
            globalAyahNumber: arItem.number
          };
        });

        // Persist to IndexedDB so it's instantly available offline
        await saveCachedTranslation(surahId, pairedAyahs);
        return pairedAyahs;
      }
    }
  } catch (err) {
    console.warn(`Could not fetch online translation for Surah ${surahId}:`, err);
  }

  return [];
}

/**
 * Quietly pre-cache popular Surahs (Al-Fatihah, Al-Kahf, Yaseen, Al-Mulk, etc.)
 * during browser idle time so they are permanently available offline.
 */
export function preloadPopularSurahs(): void {
  if (typeof window === 'undefined') return;

  const runPreload = async () => {
    const popularSurahs = [1, 18, 36, 67, 112, 113, 114];
    for (const id of popularSurahs) {
      try {
        const cached = await getCachedTranslation(id);
        if (!cached || cached.length === 0) {
          await loadSurahAyahs(id);
          // Small pause between network requests
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (e) {
        // Continue silently
      }
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 10000 });
  } else {
    setTimeout(runPreload, 3000);
  }
}
