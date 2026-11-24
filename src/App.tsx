import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Surah } from '@/types';
import surahsData from '@/data/surahs.json';
import { Navbar } from '@/components/Navbar';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FullPlayer } from '@/components/FullPlayer';
import { useAudio } from '@/contexts/AudioContext';
import { downloadManager } from '@/services/downloader';
import { AlertCircle, X, Loader2 } from 'lucide-react';

// Code-split / lazy load all views for optimal initial bundle & fast TTI
const HomeView = lazy(() => import('@/views/HomeView').then(m => ({ default: m.HomeView })));
const SurahListView = lazy(() => import('@/views/SurahListView').then(m => ({ default: m.SurahListView })));
const ReaderView = lazy(() => import('@/views/ReaderView').then(m => ({ default: m.ReaderView })));
const DownloadsView = lazy(() => import('@/views/DownloadsView').then(m => ({ default: m.DownloadsView })));
const BookmarksView = lazy(() => import('@/views/BookmarksView').then(m => ({ default: m.BookmarksView })));
const SettingsView = lazy(() => import('@/views/SettingsView').then(m => ({ default: m.SettingsView })));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-500 animate-in fade-in duration-200">
    <div className="w-9 h-9 rounded-full border-3 border-emerald-700/30 border-t-amber-400 animate-spin mb-3 shadow-sm" />
    <span className="text-xs font-semibold text-emerald-800 dark:text-amber-400">ലോഡിംഗ്...</span>
  </div>
);

export const App: React.FC = () => {
  const surahs = surahsData as Surah[];
  const { currentSurah, errorMessage, clearError, nextSurah } = useAudio();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [readerTarget, setReaderTarget] = useState<{ surah: Surah; initialAyah?: number } | null>(null);
  const [activeDownloadsCount, setActiveDownloadsCount] = useState(0);

  // Monitor active downloads count for badge
  useEffect(() => {
    const unsub = downloadManager.subscribe(() => {
      // Periodic check
    });
    return () => unsub();
  }, [surahs]);

  // Listen for custom auto-next event
  useEffect(() => {
    const handleNext = () => {
      nextSurah(surahs);
    };
    window.addEventListener('quran:next-surah', handleNext);
    return () => window.removeEventListener('quran:next-surah', handleNext);
  }, [surahs, nextSurah]);

  const handleOpenReader = (surah: Surah, initialAyah?: number) => {
    setReaderTarget({ surah, initialAyah });
  };

  const handleBackFromReader = () => {
    setReaderTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0b1411] text-stone-900 dark:text-stone-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Playback Error Alert Toast */}
      {errorMessage && (
        <div className="sticky top-[61px] z-40 bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={clearError} className="p-1 hover:bg-rose-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area with Suspense Lazy Loading */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-32">
        <Suspense fallback={<PageLoader />}>
          {readerTarget ? (
            <ReaderView
              surah={readerTarget.surah}
              initialAyahNumber={readerTarget.initialAyah}
              onBack={handleBackFromReader}
            />
          ) : (
            <>
              {currentTab === 'home' && (
                <HomeView
                  surahs={surahs}
                  onSelectSurah={(s) => setReaderTarget({ surah: s })}
                  onOpenReader={handleOpenReader}
                  onNavigateTab={(t) => setCurrentTab(t)}
                />
              )}

              {currentTab === 'surahs' && (
                <SurahListView surahs={surahs} onOpenReader={handleOpenReader} />
              )}

              {currentTab === 'downloads' && (
                <DownloadsView surahs={surahs} onOpenReader={handleOpenReader} />
              )}

              {currentTab === 'bookmarks' && (
                <BookmarksView surahs={surahs} onOpenReader={handleOpenReader} />
              )}

              {currentTab === 'settings' && <SettingsView />}
            </>
          )}
        </Suspense>
      </main>

      {/* Sticky Mini Player (visible if a surah is active and not inside full player) */}
      <MiniPlayer />

      {/* Full-screen Player Sheet / Modal */}
      <FullPlayer surahs={surahs} onOpenReader={handleOpenReader} />

      {/* Bottom Navigation Bar */}
      {!readerTarget && (
        <BottomNav
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeDownloadsCount={activeDownloadsCount}
        />
      )}
    </div>
  );
};
