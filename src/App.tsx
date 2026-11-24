import React, { useState, useEffect } from 'react';
import { Surah } from '@/types';
import surahsData from '@/data/surahs.json';
import { Navbar } from '@/components/Navbar';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FullPlayer } from '@/components/FullPlayer';
import { HomeView } from '@/views/HomeView';
import { SurahListView } from '@/views/SurahListView';
import { ReaderView } from '@/views/ReaderView';
import { DownloadsView } from '@/views/DownloadsView';
import { BookmarksView } from '@/views/BookmarksView';
import { SettingsView } from '@/views/SettingsView';
import { useAudio } from '@/contexts/AudioContext';
import { downloadManager } from '@/services/downloader';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const surahs = surahsData as Surah[];
  const { currentSurah, errorMessage, clearError, nextSurah } = useAudio();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedSurahForReader, setSelectedSurahForReader] = useState<Surah | null>(null);
  const [activeDownloadsCount, setActiveDownloadsCount] = useState(0);

  // Monitor active downloads count for badge
  useEffect(() => {
    const unsub = downloadManager.subscribe((task) => {
      // Refresh count
      downloadManager.isDownloaded(surahs[0]).then(() => {
        // Simple tick
      });
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

  const handleOpenReader = (surah: Surah) => {
    setSelectedSurahForReader(surah);
  };

  const handleBackFromReader = () => {
    setSelectedSurahForReader(null);
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-32">
        {selectedSurahForReader ? (
          <ReaderView surah={selectedSurahForReader} onBack={handleBackFromReader} />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeView
                surahs={surahs}
                onSelectSurah={(s) => setSelectedSurahForReader(s)}
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
      </main>

      {/* Sticky Mini Player (visible if a surah is active and not inside full player) */}
      <MiniPlayer />

      {/* Full-screen Player Sheet / Modal */}
      <FullPlayer surahs={surahs} onOpenReader={handleOpenReader} />

      {/* Bottom Navigation Bar */}
      {!selectedSurahForReader && (
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
