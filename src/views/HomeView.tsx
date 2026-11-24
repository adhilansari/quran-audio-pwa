import React, { useState, useEffect } from 'react';
import { Play, Pause, BookOpen, Clock, Sparkles, ChevronRight, DownloadCloud, Volume2, Loader2 } from 'lucide-react';
import { Surah, PlayHistory } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudio } from '@/contexts/AudioContext';
import { getPlayHistory } from '@/services/db';

interface HomeViewProps {
  surahs: Surah[];
  onSelectSurah: (surah: Surah) => void;
  onOpenReader: (surah: Surah) => void;
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

  useEffect(() => {
    async function loadHistory() {
      const history = await getPlayHistory();
      if (history.length > 0) {
        setLastHistory(history[0]);
      }
    }
    loadHistory();
  }, [isPlaying]);

  const lastPlayedSurah = lastHistory ? surahs.find(s => s.id === lastHistory.surahId) : null;

  // Curated Quick Access surahs: 1. Al-Fatihah, 18. Al-Kahf, 36. Yasin, 67. Al-Mulk
  const quickSurahs = [1, 18, 36, 67]
    .map(id => surahs.find(s => s.id === id))
    .filter(Boolean) as Surah[];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Hero Greeting / Daily Ayah Card */}
      <div className="bg-gradient-to-tr from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-amber-400/20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-amber-400/30 text-[11px] font-bold text-amber-300 mb-3">
            <Sparkles className="w-3 h-3" />
            <span>{t('dailyAyah')}</span>
          </div>

          {/* Daily Verse (Surah Al-Baqarah 2:286 or Al-Fatihah) */}
          <p className="font-arabic text-xl sm:text-2xl text-amber-100 leading-relaxed mb-3 text-right">
            لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا
          </p>

          <p className="font-malayalam text-xs sm:text-sm text-emerald-100 leading-normal mb-3">
            "അല്ലാഹു ഒരാളോടും അവരുടെ കഴിവിനപ്പുറമുള്ള യാതൊന്നും കൽപിക്കുന്നില്ല."
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-emerald-700/50 text-[11px] text-emerald-200">
            <span>സൂറത്തുൽ ബഖറ 2:286</span>
            <button
              onClick={() => {
                const s2 = surahs.find(s => s.id === 2);
                if (s2) onOpenReader(s2);
              }}
              className="text-amber-300 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>{t('readerMode')}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Continue Listening Card (if history exists) */}
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
