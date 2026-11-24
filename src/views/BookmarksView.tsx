import React, { useState, useEffect } from 'react';
import { Bookmark, Play, Trash2, BookOpen } from 'lucide-react';
import { Surah, Bookmark as BookmarkType } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudio } from '@/contexts/AudioContext';
import { getAllBookmarks, removeBookmark } from '@/services/db';

interface BookmarksViewProps {
  surahs: Surah[];
  onOpenReader: (surah: Surah) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ surahs, onOpenReader }) => {
  const { t, settings } = useSettings();
  const { playSurah } = useAudio();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);

  const loadBookmarks = async () => {
    const list = await getAllBookmarks();
    setBookmarks(list);
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleDelete = async (id: string) => {
    await removeBookmark(id);
    await loadBookmarks();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-500" />
          <span>{t('bookmarks')}</span>
        </h2>
        <span className="text-xs text-stone-500">{bookmarks.length} saved</span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-6 text-stone-500">
          <Bookmark className="w-10 h-10 mx-auto mb-2 text-stone-300 dark:text-emerald-900" />
          <p className="text-sm font-medium">{t('noBookmarks')}</p>
          <p className="text-xs mt-1 text-stone-400">
            Tap the bookmark icon in the reader view to save your favorite Ayahs.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookmarks.map((bm) => {
            const surah = surahs.find(s => s.id === bm.surahId);
            if (!surah) return null;

            return (
              <div
                key={bm.id}
                className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm flex items-center justify-between gap-3"
              >
                <div
                  onClick={() => onOpenReader(surah)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300 font-bold text-xs flex flex-col items-center justify-center flex-shrink-0">
                    <span>{surah.number}</span>
                    {bm.ayahNumber && <span className="text-[9px]">:{bm.ayahNumber}</span>}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
                      {bm.ayahNumber && ` (ആയത്ത് ${bm.ayahNumber})`}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {surah.nameArabic} • {new Date(bm.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onOpenReader(surah)}
                    className="p-2 text-stone-500 hover:text-emerald-700 dark:hover:text-stone-200 transition-colors"
                    title={t('readerMode')}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => playSurah(surah)}
                    className="p-2 rounded-xl bg-emerald-800 text-amber-300 hover:bg-emerald-700 transition-colors"
                    title="Play"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(bm.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
