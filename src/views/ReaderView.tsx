import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  Type,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  Volume2,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';
import { Surah, Ayah } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudio } from '@/contexts/AudioContext';
import { isBookmarked, addBookmark, removeBookmark } from '@/services/db';
import { loadSurahAyahs } from '@/services/translationService';

interface ReaderViewProps {
  surah: Surah;
  onBack: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ surah, onBack }) => {
  const { settings, updateSetting, t } = useSettings();
  const {
    currentSurah,
    isPlaying,
    isLoading: isChapterAudioLoading,
    currentAyahNumber,
    activeTimings,
    playSurah,
    togglePlay
  } = useAudio();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<number, boolean>>({});
  const [showTypographyControls, setShowTypographyControls] = useState(false);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);

  // Progressive Lazy Loading for large chapters (e.g. Al-Baqarah 286 ayahs)
  const [visibleCount, setVisibleCount] = useState(30);

  // Ayah-level single recitation audio
  const [playingAyahNum, setPlayingAyahNum] = useState<number | null>(null);
  const ayahAudioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load Chapter Ayahs (IndexedDB -> Static -> Dynamic Open Quran CDN)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setVisibleCount(35);

    async function load() {
      try {
        const data = await loadSurahAyahs(surah.id);
        if (isMounted) {
          setAyahs(data);
        }
      } catch (err) {
        if (isMounted) setAyahs([]);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Check bookmarks
      const bMap: Record<number, boolean> = {};
      for (let i = 1; i <= Math.min(surah.ayahCount, 25); i++) {
        bMap[i] = await isBookmarked(surah.id, i);
      }
      if (isMounted) setBookmarkedMap(bMap);
    }

    load();

    return () => {
      isMounted = false;
      if (ayahAudioRef.current) {
        ayahAudioRef.current.pause();
        ayahAudioRef.current = null;
      }
    };
  }, [surah.id]);

  // Smooth scroll into view when active ayah changes (if chapter timings exist)
  useEffect(() => {
    if (currentAyahNumber && currentSurah?.id === surah.id) {
      if (currentAyahNumber > visibleCount) {
        setVisibleCount(Math.min(ayahs.length, currentAyahNumber + 10));
      }
      const el = ayahRefs.current.get(currentAyahNumber);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentAyahNumber, currentSurah?.id, surah.id, visibleCount, ayahs.length]);

  const toggleBookmark = async (ayahNum: number) => {
    const isSaved = bookmarkedMap[ayahNum];
    const id = `ayah-${surah.id}-${ayahNum}`;

    if (isSaved) {
      await removeBookmark(id);
      setBookmarkedMap(prev => ({ ...prev, [ayahNum]: false }));
    } else {
      await addBookmark({
        id,
        surahId: surah.id,
        ayahNumber: ayahNum,
        createdAt: Date.now()
      });
      setBookmarkedMap(prev => ({ ...prev, [ayahNum]: true }));
    }
  };

  // Play individual Ayah audio recitation
  const handlePlaySingleAyah = (ayah: Ayah) => {
    if (playingAyahNum === ayah.ayah) {
      if (ayahAudioRef.current) {
        ayahAudioRef.current.pause();
      }
      setPlayingAyahNum(null);
      return;
    }

    if (ayahAudioRef.current) {
      ayahAudioRef.current.pause();
    }

    // Global ayah index for CDN audio recitation
    const globalIdx = ayah.globalAyahNumber;
    if (globalIdx) {
      const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalIdx}.mp3`;
      const audio = new Audio(url);
      ayahAudioRef.current = audio;
      setPlayingAyahNum(ayah.ayah);

      audio.play().catch(e => {
        console.warn('Single ayah audio play error:', e);
        setPlayingAyahNum(null);
      });

      audio.onended = () => {
        setPlayingAyahNum(null);
      };
      audio.onerror = () => {
        setPlayingAyahNum(null);
      };
    } else {
      // Fallback: start surah chapter audio
      playSurah(surah);
    }
  };

  const handleCopyAyah = (ayah: Ayah) => {
    const textToCopy = `${ayah.arabic}\n\n${ayah.malayalam}\n\n[ഖുർആൻ ${surah.number}:${ayah.ayah}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAyah(ayah.ayah);
    setTimeout(() => {
      setCopiedAyah(null);
    }, 2000);
  };

  const isCurrentSurahPlaying = currentSurah?.id === surah.id && isPlaying;
  const isCurrentSurahLoading = currentSurah?.id === surah.id && isChapterAudioLoading;

  const visibleAyahs = ayahs.slice(0, visibleCount);
  const hasMore = visibleCount < ayahs.length;

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0b1411] text-stone-900 dark:text-stone-100 pb-36 animate-in fade-in duration-200">
      {/* Sticky Reader Navigation Bar */}
      <div className="sticky top-0 z-20 bg-[#faf8f5]/95 dark:bg-[#0b1411]/95 backdrop-blur-md border-b border-stone-200 dark:border-emerald-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-emerald-950 transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
              {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {surah.englishName} • {surah.ayahCount} {t('ayahCount')}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Typography Controls Toggle */}
          <button
            onClick={() => setShowTypographyControls(!showTypographyControls)}
            className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
              showTypographyControls
                ? 'bg-emerald-800 text-amber-300 border-emerald-700'
                : 'border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-emerald-950'
            }`}
            title="Adjust Fonts"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Chapter Audio Play / Pause Button */}
          <button
            onClick={() => {
              if (isCurrentSurahPlaying) {
                togglePlay();
              } else {
                playSurah(surah);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-xs shadow-sm transition-all"
            title="Listen to full chapter recitation"
          >
            {isCurrentSurahLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : isCurrentSurahPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('listenAudio')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Typography and Visibility Popover Bar */}
      {showTypographyControls && (
        <div className="bg-stone-100 dark:bg-[#12201c] border-b border-stone-200 dark:border-emerald-950 px-4 py-3 animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Arabic Font Size Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                <span>{t('arabicSize')}</span>
                <span>{settings.arabicFontSize}px</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-500">A-</span>
                <input
                  type="range"
                  min={22}
                  max={42}
                  value={settings.arabicFontSize}
                  onChange={(e) => updateSetting('arabicFontSize', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-stone-300 dark:bg-emerald-950 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-base font-bold text-stone-800 dark:text-stone-100">A+</span>
              </div>
            </div>

            {/* Malayalam Font Size Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                <span>{t('malayalamSize')}</span>
                <span>{settings.malayalamFontSize}px</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-500">A-</span>
                <input
                  type="range"
                  min={13}
                  max={24}
                  value={settings.malayalamFontSize}
                  onChange={(e) => updateSetting('malayalamFontSize', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-stone-300 dark:bg-emerald-950 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-base font-bold text-stone-800 dark:text-stone-100">A+</span>
              </div>
            </div>

            {/* View Toggles */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-emerald-900/60 text-xs">
              <button
                onClick={() => updateSetting('showArabic', !settings.showArabic)}
                className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-medium"
              >
                {settings.showArabic ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                <span>{t('showArabicText')}</span>
              </button>

              <button
                onClick={() => updateSetting('showMalayalam', !settings.showMalayalam)}
                className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-medium"
              >
                {settings.showMalayalam ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                <span>{t('showMalayalamText')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Title Card */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-3">
        <div className="bg-gradient-to-tr from-emerald-900 to-emerald-800 rounded-3xl p-6 text-center text-white shadow-md relative overflow-hidden border border-amber-400/20">
          <div className="absolute top-3 right-4 text-[10px] tracking-widest font-bold uppercase text-amber-300">
            {surah.revelationType === 'Meccan' ? 'മക്കീ' : 'മദനീ'}
          </div>
          <h1 className="font-arabic text-4xl sm:text-5xl text-amber-300 mb-2">
            {surah.nameArabic}
          </h1>
          <h2 className="text-lg font-bold">
            {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
          </h2>
          <p className="text-xs text-emerald-200 italic mt-0.5">
            "{settings.language === 'ml' ? surah.malayalamMeaning : surah.englishMeaning}"
          </p>

          {/* Bismillah Header (except Surah 9 At-Tawbah) */}
          {surah.id !== 9 && (
            <div className="mt-5 pt-4 border-t border-emerald-700/60">
              <p className="font-arabic text-2xl sm:text-3xl text-amber-200">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="font-malayalam text-xs text-emerald-100/90 mt-1">
                പരമകാരുണികനും കരുണാനിധിയുമായ അല്ലാഹുവിന്റെ നാമത്തിൽ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ayahs List Container */}
      <div className="max-w-2xl mx-auto px-4 space-y-3 mt-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white dark:bg-[#12201c] rounded-2xl p-4 border border-stone-200 dark:border-emerald-950 animate-pulse">
                <div className="h-4 bg-stone-200 dark:bg-emerald-950 rounded w-16 mb-4" />
                <div className="h-6 bg-stone-200 dark:bg-emerald-950 rounded w-full mb-3" />
                <div className="h-4 bg-stone-200 dark:bg-emerald-950 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : ayahs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-6">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-2">
              Translation text could not be loaded while offline.
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Connect to the internet once to cache all verses of Surah {surah.number} permanently.
            </p>
            <button
              onClick={() => playSurah(surah)}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-amber-300 font-bold text-xs"
            >
              Play Surah Audio
            </button>
          </div>
        ) : (
          <>
            {visibleAyahs.map((ayah) => {
              const isHighlight =
                currentSurah?.id === surah.id && currentAyahNumber === ayah.ayah;
              const isSaved = bookmarkedMap[ayah.ayah];
              const isPlayingThisAyah = playingAyahNum === ayah.ayah;
              const isCopied = copiedAyah === ayah.ayah;

              return (
                <div
                  key={ayah.ayah}
                  ref={(el) => {
                    if (el) ayahRefs.current.set(ayah.ayah, el);
                    else ayahRefs.current.delete(ayah.ayah);
                  }}
                  className={`rounded-2xl p-4 transition-all duration-300 border ${
                    isHighlight
                      ? 'bg-amber-50 dark:bg-emerald-950/80 border-amber-400 dark:border-amber-400/80 shadow-md ring-2 ring-amber-400/20'
                      : 'bg-white dark:bg-[#12201c] border-stone-200 dark:border-emerald-950/70 hover:border-emerald-300 dark:hover:border-emerald-900'
                  }`}
                >
                  {/* Ayah Header Row */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-emerald-950">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                        {ayah.ayah}
                      </span>
                      {isHighlight && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse">
                          Now Playing
                        </span>
                      )}
                    </div>

                    {/* Actions: Play Ayah, Copy, Bookmark */}
                    <div className="flex items-center gap-1">
                      {/* Play Single Ayah Recitation */}
                      <button
                        onClick={() => handlePlaySingleAyah(ayah)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isPlayingThisAyah
                            ? 'text-amber-500 bg-amber-50 dark:bg-emerald-950'
                            : 'text-stone-400 hover:text-emerald-700 dark:hover:text-amber-300'
                        }`}
                        title={isPlayingThisAyah ? 'Stop Ayah Recitation' : 'Listen to this Ayah'}
                      >
                        {isPlayingThisAyah ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Copy Ayah */}
                      <button
                        onClick={() => handleCopyAyah(ayah)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
                        title="Copy Ayah text"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Bookmark Ayah */}
                      <button
                        onClick={() => toggleBookmark(ayah.ayah)}
                        className="p-1.5 text-stone-400 hover:text-amber-500 rounded-lg transition-colors"
                        title={isSaved ? 'Remove Bookmark' : 'Bookmark Ayah'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Arabic Scripture */}
                  {settings.showArabic && (
                    <div
                      className="font-arabic text-stone-900 dark:text-stone-50 leading-relaxed py-1"
                      style={{ fontSize: `${settings.arabicFontSize}px` }}
                    >
                      {ayah.arabic}
                      <span className="inline-block mx-1.5 text-amber-600 dark:text-amber-400 text-sm font-bold">
                        ﴿{ayah.ayah}﴾
                      </span>
                    </div>
                  )}

                  {/* Malayalam Translation */}
                  {settings.showMalayalam && (
                    <div
                      className="font-malayalam text-stone-700 dark:text-stone-300 leading-normal pt-2 border-t border-stone-100 dark:border-emerald-950/60"
                      style={{ fontSize: `${settings.malayalamFontSize}px` }}
                    >
                      {ayah.malayalam}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More Ayahs Button (Progressive Lazy Loading) */}
            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 35)}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#12201c] border border-stone-200 dark:border-emerald-900 text-xs font-bold text-emerald-800 dark:text-amber-300 shadow-sm hover:bg-stone-50 dark:hover:bg-emerald-950 transition-all flex items-center gap-1.5 mx-auto"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>കൂടുതൽ ആയത്തുകൾ കാണുക ({visibleCount} of {ayahs.length})</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
