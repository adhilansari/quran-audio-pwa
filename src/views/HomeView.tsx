import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  BookOpen,
  Clock,
  Sparkles,
  ChevronRight,
  DownloadCloud,
  Volume2,
  Loader2,
  Bookmark,
  History,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Surah, PlayHistory, ReadingHistoryItem } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudio } from '@/contexts/AudioContext';
import { getPlayHistory, getReadingHistory } from '@/services/db';
import { CATCHY_AYAHS, getDailyAyahIndex } from '@/data/catchyAyahs';

interface HomeViewProps {
  surahs: Surah[];
  onSelectSurah: (surah: Surah) => void;
  onOpenReader: (surah: Surah, initialAyah?: number) => void;
  onNavigateTab: (tab: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  surahs,
  onSelectSurah,
  onOpenReader,
  onNavigateTab
}) => {
  const { settings, t } = useSettings();
  const { playSurah, togglePlay, currentSurah, isPlaying, isLoading } = useAudio();
  const [lastHistory, setLastHistory] = useState<PlayHistory | null>(null);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [dailyAyahIndex, setDailyAyahIndex] = useState(() => getDailyAyahIndex());
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    async function loadData() {
      const history = await getPlayHistory();
      if (history.length > 0) {
        setLastHistory(history[0]);
      }
      const readHist = await getReadingHistory();
      setReadingHistory(readHist);
    }
    loadData();
  }, [isPlaying]);

  const currentCatchyAyah = CATCHY_AYAHS[dailyAyahIndex] || CATCHY_AYAHS[0];

  const handleShuffleAyah = () => {
    setIsShuffling(true);
    let nextIdx = Math.floor(Math.random() * CATCHY_AYAHS.length);
    if (nextIdx === dailyAyahIndex) {
      nextIdx = (nextIdx + 1) % CATCHY_AYAHS.length;
    }
    setTimeout(() => {
      setDailyAyahIndex(nextIdx);
      setIsShuffling(false);
    }, 200);
  };

  const lastPlayedSurah = lastHistory ? surahs.find(s => s.id === lastHistory.surahId) : null;

  // Curated Quick Access surahs: 1. Al-Fatihah, 18. Al-Kahf, 36. Yasin, 67. Al-Mulk
  const quickSurahs = [1, 18, 36, 67]
    .map(id => surahs.find(s => s.id === id))
    .filter(Boolean) as Surah[];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Hero Greeting / Catchy Daily Ayah Card (Rotates daily + on-demand shuffle) */}
      <div className="bg-gradient-to-tr from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-amber-400/20">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-amber-400/30 text-[11px] font-bold text-amber-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('dailyAyah')}</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-emerald-200">
                {settings.language === 'ml' ? currentCatchyAyah.badgeMalayalam : currentCatchyAyah.badgeEnglish}
              </span>
            </div>

            {/* Shuffle / Random Ayah Button */}
            <button
              onClick={handleShuffleAyah}
              className="p-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950 border border-amber-400/30 text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 text-[11px] font-bold"
              title={settings.language === 'ml' ? 'മറ്റൊരു വചനം കാണുക' : 'Shuffle Ayah'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">
                {settings.language === 'ml' ? 'മാറ്റുക' : 'Shuffle'}
              </span>
            </button>
          </div>

          {/* Catchy Verse Arabic */}
          <p className="font-arabic text-xl sm:text-2xl text-amber-100 leading-relaxed mb-3 text-right">
            {currentCatchyAyah.arabic}
          </p>

          {/* Catchy Verse Malayalam */}
          <p className="font-malayalam text-xs sm:text-sm text-emerald-100 leading-normal mb-3">
            "{currentCatchyAyah.malayalam}"
          </p>

          <div className="flex items-center justify-between pt-2.5 border-t border-emerald-700/50 text-[11px] text-emerald-200">
            <span className="font-medium">
              {settings.language === 'ml'
                ? `സൂറത്ത് ${currentCatchyAyah.surahNameMalayalam} ${currentCatchyAyah.surahNumber}:${currentCatchyAyah.ayahNumber}`
                : `Surah ${currentCatchyAyah.surahNameEnglish} ${currentCatchyAyah.surahNumber}:${currentCatchyAyah.ayahNumber}`}
            </span>
            <button
              onClick={() => {
                const targetSurah = surahs.find(s => s.id === currentCatchyAyah.surahId);
                if (targetSurah) onOpenReader(targetSurah, currentCatchyAyah.ayahNumber);
              }}
              className="text-amber-300 font-bold hover:underline flex items-center gap-0.5 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-amber-400/20"
            >
              <span>{t('readerMode')}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Continue Listening Card (Audio history) */}
      {lastPlayedSurah && (
        <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-400 border border-amber-300/40 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {lastPlayedSurah.number}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-amber-400">
                {t('continueListening')}
              </span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                {settings.language === 'ml' ? lastPlayedSurah.malayalamName : lastPlayedSurah.englishName}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {lastPlayedSurah.nameArabic} • {lastPlayedSurah.ayahCount} Ayahs
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (currentSurah?.id === lastPlayedSurah.id && isPlaying) {
                togglePlay();
              } else {
                playSurah(lastPlayedSurah, lastHistory?.position);
              }
            }}
            className="w-10 h-10 rounded-full bg-emerald-800 hover:bg-emerald-700 text-amber-300 flex items-center justify-center shadow-md flex-shrink-0 active:scale-95 transition-all"
            title="Resume playback"
          >
            {currentSurah?.id === lastPlayedSurah.id && isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : currentSurah?.id === lastPlayedSurah.id && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Recent Reading History (Last 10 Surahs with exact last Ayah) */}
      {readingHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span>{settings.language === 'ml' ? 'അവസാനം വായിച്ചവ' : 'Recent Reading'}</span>
            </h2>
            <span className="text-[11px] font-semibold text-stone-400">
              {readingHistory.length} {settings.language === 'ml' ? 'സൂറത്തുകൾ' : 'Surahs'}
            </span>
          </div>

          <div className="space-y-2">
            {readingHistory.slice(0, 10).map((item) => {
              const matchedSurah = surahs.find(s => s.id === item.surahId);
              if (!matchedSurah) return null;
              const progressPct = Math.min(100, Math.round((item.ayahNumber / item.surahTotalAyahs) * 100));

              return (
                <div
                  key={item.surahId}
                  onClick={() => onOpenReader(matchedSurah, item.ayahNumber)}
                  className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-3.5 hover:border-amber-400/60 dark:hover:border-amber-400/40 cursor-pointer shadow-xs transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-amber-400 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      {matchedSurah.number}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-emerald-700 dark:group-hover:text-amber-300 transition-colors">
                          {settings.language === 'ml' ? matchedSurah.malayalamName : matchedSurah.englishName}
                        </h4>
                        <span className="text-[11px] text-stone-400 font-arabic">
                          {matchedSurah.nameArabic}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          {settings.language === 'ml' ? 'ആയത്ത്' : 'Ayah'} {item.ayahNumber} / {item.surahTotalAyahs}
                        </span>
                        <span className="text-[10px] text-stone-400">({progressPct}%)</span>
                      </div>

                      {/* Reading Progress Bar */}
                      <div className="w-36 max-w-full h-1 bg-stone-100 dark:bg-emerald-950 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-amber-400 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resume Reading Button */}
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-amber-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-xl transition-all flex-shrink-0 group-hover:shadow-xs">
                    <span>{settings.language === 'ml' ? 'തുടരുക' : 'Resume'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Access Surahs */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
            <span>{t('quickAccess')}</span>
          </h2>
          <button
            onClick={() => onNavigateTab('surahs')}
            className="text-xs font-semibold text-emerald-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
          >
            <span>{t('allSurahs')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {quickSurahs.map(surah => (
            <div
              key={surah.id}
              onClick={() => onOpenReader(surah)}
              className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-3.5 hover:border-emerald-400 dark:hover:border-emerald-800 cursor-pointer shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                  {surah.number}
                </span>
                <span className="font-arabic text-sm text-emerald-800 dark:text-amber-300">
                  {surah.nameArabic}
                </span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white truncate">
                {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {surah.englishName} • {surah.ayahCount} Ayahs
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
