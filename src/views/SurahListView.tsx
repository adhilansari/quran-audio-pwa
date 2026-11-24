import React, { useState, useEffect, useMemo } from 'react';
import { Search, Play, Pause, BookOpen, DownloadCloud, CheckCircle2, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { Surah, DownloadTask } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudio } from '@/contexts/AudioContext';
import { downloadManager } from '@/services/downloader';
import { getAllDownloads, getAllBookmarks, isBookmarked } from '@/services/db';
import { formatBytes } from '@/services/storage';

interface SurahListViewProps {
  surahs: Surah[];
  onOpenReader: (surah: Surah) => void;
}

export const SurahListView: React.FC<SurahListViewProps> = ({ surahs, onOpenReader }) => {
  const { settings, t } = useSettings();
  const { currentSurah, isPlaying, isLoading, playSurah, togglePlay } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'downloaded' | 'bookmarked'>('all');
  const [downloadsMap, setDownloadsMap] = useState<Record<number, DownloadTask>>({});
  const [bookmarkedSurahIds, setBookmarkedSurahIds] = useState<Set<number>>(new Set());

  // Load downloads status and bookmarks
  useEffect(() => {
    async function refreshState() {
      const downloads = await getAllDownloads();
      const dMap: Record<number, DownloadTask> = {};
      downloads.forEach(d => {
        dMap[d.surahId] = d;
      });
      setDownloadsMap(dMap);

      const bookmarks = await getAllBookmarks();
      const bSet = new Set(bookmarks.map(b => b.surahId));
      setBookmarkedSurahIds(bSet);
    }

    refreshState();

    // Subscribe to download events
    const unsub = downloadManager.subscribe((task) => {
      setDownloadsMap(prev => ({ ...prev, [task.surahId]: task }));
    });

    return () => unsub();
  }, []);

  // Filter & Search
  const filteredSurahs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return surahs.filter(surah => {
      // Search matching
      const matchesSearch =
        !q ||
        surah.number.toString().includes(q) ||
        surah.englishName.toLowerCase().includes(q) ||
        surah.malayalamName.toLowerCase().includes(q) ||
        surah.nameArabic.includes(q) ||
        surah.englishMeaning.toLowerCase().includes(q) ||
        surah.malayalamMeaning.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Filter tabs
      if (filterTab === 'downloaded') {
        return downloadsMap[surah.id]?.status === 'completed';
      }
      if (filterTab === 'bookmarked') {
        return bookmarkedSurahIds.has(surah.id);
      }
      return true;
    });
  }, [surahs, searchQuery, filterTab, downloadsMap, bookmarkedSurahIds]);

  const handleDownloadToggle = (surah: Surah) => {
    const status = downloadsMap[surah.id]?.status;
    if (status === 'completed') {
      // Already downloaded
      return;
    }
    if (status === 'downloading') {
      downloadManager.pauseDownload(surah.id);
    } else {
      downloadManager.downloadSurah(surah);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#12201c] border border-stone-200 dark:border-emerald-950 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs (All, Downloaded, Bookmarks) */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-[#12201c] rounded-xl text-xs font-semibold">
        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            filterTab === 'all'
              ? 'bg-white dark:bg-emerald-900 text-emerald-800 dark:text-amber-300 shadow-sm font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          {t('allSurahs')} (114)
        </button>

        <button
          onClick={() => setFilterTab('downloaded')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            filterTab === 'downloaded'
              ? 'bg-white dark:bg-emerald-900 text-emerald-800 dark:text-amber-300 shadow-sm font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          {t('offlineDownloaded')}
        </button>

        <button
          onClick={() => setFilterTab('bookmarked')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            filterTab === 'bookmarked'
              ? 'bg-white dark:bg-emerald-900 text-emerald-800 dark:text-amber-300 shadow-sm font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          {t('bookmarks')}
        </button>
      </div>

      {/* Surahs List */}
      <div className="space-y-2.5">
        {filteredSurahs.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <p className="text-sm font-medium">No surahs match your query.</p>
          </div>
        ) : (
          filteredSurahs.map((surah) => {
            const isPlayingThis = currentSurah?.id === surah.id && isPlaying;
            const isLoadingThis = currentSurah?.id === surah.id && isLoading;
            const downloadTask = downloadsMap[surah.id];
            const isDownloaded = downloadTask?.status === 'completed';
            const isDownloading = downloadTask?.status === 'downloading';

            return (
              <div
                key={surah.id}
                className={`rounded-2xl p-3.5 transition-all duration-200 border bg-white dark:bg-[#12201c] shadow-sm flex items-center justify-between gap-3 ${
                  isPlayingThis
                    ? 'border-amber-400 dark:border-amber-400/80 ring-1 ring-amber-400/30'
                    : 'border-stone-200 dark:border-emerald-950/70 hover:border-emerald-300 dark:hover:border-emerald-900'
                }`}
              >
                {/* Left: Medallion & Names */}
                <div
                  onClick={() => onOpenReader(surah)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-emerald-950/80 border border-stone-200 dark:border-emerald-900 flex items-center justify-center font-bold text-stone-800 dark:text-amber-300 text-sm flex-shrink-0">
                    {surah.number}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
                      </h3>
                      <span className="text-[10px] uppercase font-semibold text-stone-400">
                        {surah.revelationType === 'Meccan' ? 'മക്കീ' : 'മദനീ'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {settings.language === 'ml' ? surah.englishName : surah.malayalamName} • {surah.ayahCount} {t('ayahCount')} • {formatBytes(surah.fileSizeBytes)}
                    </p>
                  </div>
                </div>

                {/* Right: Arabic calligraphy & Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-arabic text-lg text-emerald-800 dark:text-amber-300 font-semibold hidden xs:inline px-1">
                    {surah.nameArabic}
                  </span>

                  {/* Read button */}
                  <button
                    onClick={() => onOpenReader(surah)}
                    className="p-2 text-stone-500 hover:text-emerald-700 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                    title={t('readerMode')}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  {/* Download button / status */}
                  <button
                    onClick={() => handleDownloadToggle(surah)}
                    className={`p-2 rounded-xl transition-all ${
                      isDownloaded
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isDownloading
                        ? 'text-amber-500 animate-pulse'
                        : 'text-stone-400 hover:text-emerald-700 dark:hover:text-stone-200'
                    }`}
                    title={isDownloaded ? t('downloaded') : t('download')}
                  >
                    {isDownloaded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isDownloading ? (
                      <div className="relative flex items-center justify-center">
                        <DownloadCloud className="w-4 h-4" />
                        <span className="absolute -bottom-2 text-[9px] font-bold">
                          {downloadTask.progress}%
                        </span>
                      </div>
                    ) : (
                      <DownloadCloud className="w-4 h-4" />
                    )}
                  </button>

                  {/* Play / Pause button */}
                  <button
                    onClick={() => {
                      if (isPlayingThis) {
                        togglePlay();
                      } else {
                        playSurah(surah);
                      }
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isPlayingThis
                        ? 'bg-amber-400 text-emerald-950 font-bold shadow-md'
                        : 'bg-emerald-800 text-amber-300 hover:bg-emerald-700'
                    }`}
                    title={isLoadingThis ? 'Loading...' : isPlayingThis ? 'Pause' : 'Play'}
                  >
                    {isLoadingThis ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    ) : isPlayingThis ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
