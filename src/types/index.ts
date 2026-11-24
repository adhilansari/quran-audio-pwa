/**
 * Data Types and Models
 */

export type RevelationType = 'Meccan' | 'Medinan';

export interface Surah {
  id: number;
  number: number;
  nameArabic: string;
  englishName: string;
  englishMeaning: string;
  malayalamName: string;
  malayalamMeaning: string;
  revelationType: RevelationType;
  ayahCount: number;
  audioFile: string;
  fileSizeBytes: number;
}

export interface Ayah {
  ayah: number;
  arabic: string;
  malayalam: string;
  globalAyahNumber?: number;
}

export interface AyahTiming {
  ayah: number;
  start: number;
  end: number;
}

export type DownloadStatus = 'idle' | 'queued' | 'downloading' | 'paused' | 'completed' | 'error';

export interface DownloadTask {
  surahId: number;
  audioFile: string;
  audioUrl: string;
  fileSizeBytes: number;
  downloadedBytes: number;
  progress: number; // 0 - 100
  status: DownloadStatus;
  errorMessage?: string;
  updatedAt: number;
}

export interface Bookmark {
  id: string; // e.g. "surah-1" or "ayah-1-7"
  surahId: number;
  ayahNumber?: number;
  createdAt: number;
  note?: string;
}

export interface PlayHistory {
  surahId: number;
  position: number; // seconds
  duration: number; // seconds
  lastPlayedAt: number;
}

export interface ReadingHistoryItem {
  surahId: number;
  ayahNumber: number;
  surahNameMalayalam: string;
  surahNameEnglish: string;
  surahTotalAyahs: number;
  readAt: number;
}

export type ThemeMode =
  | 'system'
  | 'light'
  | 'dark'
  | 'sepia'
  | 'midnight'
  | 'sapphire'
  | 'amethyst'
  | 'sage'
  | 'rose'
  | 'glassDark'
  | 'glassLight';
export type UILanguage = 'ml' | 'en';
export type RepeatMode = 'off' | 'surah' | 'all';

export interface AppSettings {
  theme: ThemeMode;
  language: UILanguage;
  arabicFontSize: number;
  malayalamFontSize: number;
  showArabic: boolean;
  showMalayalam: boolean;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  autoPlayNext: boolean;
  warnOnCellularDownload: boolean;
  persistedStorage: boolean;
}
