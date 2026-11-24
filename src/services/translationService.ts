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

  // 3. High-speed dynamic fetch from open Quran CDN API
  try {
    const apiUrl = `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,ml.abdulhameed`;
    const res = await fetch(apiUrl, { cache: 'force-cache' });
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
