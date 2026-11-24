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
      const activeId = currentSurah?.id ?? readerTarget?.surah.id;
      if (activeId) {
        const currentIndex = surahs.findIndex(s => s.id === activeId);
        if (currentIndex >= 0 && currentIndex < surahs.length - 1) {
          const next = surahs[currentIndex + 1];
          nextSurah(surahs);
          if (readerTarget) {
            setReaderTarget({ surah: next });
            window.history.replaceState(
              { view: 'reader', surahId: next.id, tab: currentTab },
              '',
              `?surah=${next.id}#${currentTab}`
            );
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return;
        }
      }
      nextSurah(surahs);
    };
    window.addEventListener('quran:next-surah', handleNext);
    return () => window.removeEventListener('quran:next-surah', handleNext);
  }, [surahs, nextSurah, currentSurah, readerTarget, currentTab]);

  // Check URL on startup for deep links (e.g. ?surah=2&ayah=255) and hash tab (#surahs, etc.)
  useEffect(() => {
    const validTabs: NavTab[] = ['home', 'surahs', 'downloads', 'bookmarks', 'settings'];
    const hash = window.location.hash.replace('#', '') as NavTab;
    const initialTab: NavTab = validTabs.includes(hash) ? hash : 'home';

    if (validTabs.includes(hash)) {
      setCurrentTab(hash);
    }

    const params = new URLSearchParams(window.location.search);
    const surahParam = params.get('surah');
    if (surahParam) {
      const sId = parseInt(surahParam, 10);
      const target = surahs.find(s => s.id === sId);
      if (target) {
        const ayahParam = params.get('ayah');
        const initialAyah = ayahParam ? parseInt(ayahParam, 10) : undefined;
        setReaderTarget({ surah: target, initialAyah });
        window.history.replaceState({ view: 'reader', surahId: target.id, initialAyah, tab: initialTab }, '', window.location.href);
      }
    } else {
      window.history.replaceState({ tab: initialTab }, '', window.location.hash || `#${initialTab}`);
    }
  }, [surahs]);

  // Handle native mobile back button navigation via Popstate API
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const validTabs: NavTab[] = ['home', 'surahs', 'downloads', 'bookmarks', 'settings'];

      if (e.state && e.state.view === 'reader') {
        const surah = surahs.find(s => s.id === e.state.surahId);
        if (surah) {
          setReaderTarget({ surah, initialAyah: e.state.initialAyah });
        }
      } else {
        // Hardware/gesture back pressed -> Close Reader if open
        setReaderTarget(null);

        // Update tab according to history state or current hash
        const stateTab = e.state?.tab as NavTab;
        const hashTab = window.location.hash.replace('#', '') as NavTab;
        const targetTab = validTabs.includes(stateTab)
          ? stateTab
          : validTabs.includes(hashTab)
          ? hashTab
          : 'home';
        setCurrentTab(targetTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [surahs]);

  const handleTabChange = (tab: NavTab) => {
    if (tab === currentTab && !readerTarget) return;

    if (readerTarget) {
      setReaderTarget(null);
    }

    setCurrentTab(tab);
    window.history.pushState({ tab }, '', `#${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReader = (surah: Surah, initialAyah?: number) => {
    setReaderTarget({ surah, initialAyah });
    const query = initialAyah ? `?surah=${surah.id}&ayah=${initialAyah}` : `?surah=${surah.id}`;
    window.history.pushState({ view: 'reader', surahId: surah.id, initialAyah, tab: currentTab }, '', `${query}#${currentTab}`);
  };

  const handleBackFromReader = () => {
    if (window.history.state && window.history.state.view === 'reader') {
      window.history.back();
    } else {
      setReaderTarget(null);
      window.history.replaceState({ tab: currentTab }, '', `#${currentTab}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0b1411] bg-islamic-stars text-stone-900 dark:text-stone-100 flex flex-col selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      {/* Top Main Navbar (Only visible on main pages, hidden on Reader page) */}
      {!readerTarget && <Navbar />}

      {/* Playback Error Alert Toast */}
      {errorMessage && (
        <div className="sticky top-0 z-40 bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-md">
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
      <main className={`flex-1 w-full mx-auto ${readerTarget ? 'p-0 max-w-full' : 'max-w-2xl px-4 py-4 pb-32'}`}>
        <Suspense fallback={<PageLoader />}>
          {readerTarget ? (
            <ReaderView
              surah={readerTarget.surah}
              initialAyahNumber={readerTarget.initialAyah}
              onBack={handleBackFromReader}
              onSelectSurah={handleOpenReader}
            />
          ) : (
            <div key={currentTab} className="animate-in fade-in duration-150">
              {currentTab === 'home' && (
                <HomeView
                  surahs={surahs}
                  onSelectSurah={(s) => handleOpenReader(s)}
                  onOpenReader={handleOpenReader}
                  onNavigateTab={handleTabChange}
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
            </div>
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
          onTabChange={handleTabChange}
          activeDownloadsCount={activeDownloadsCount}
        />
      )}
    </div>
  );
};
