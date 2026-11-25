import React from 'react';
import { Home, BookOpen, DownloadCloud, Bookmark, Settings } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export type NavTab = 'home' | 'surahs' | 'downloads' | 'bookmarks' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeDownloadsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  activeDownloadsCount = 0
}) => {
  const { t } = useSettings();

  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t('home'), icon: <Home className="w-5 h-5" /> },
    { id: 'surahs', label: t('surahs'), icon: <BookOpen className="w-5 h-5" /> },
    {
      id: 'downloads',
      label: t('downloads'),
      icon: (
        <div className="relative">
          <DownloadCloud className="w-5 h-5" />
          {activeDownloadsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-500 text-[10px] text-stone-900 font-bold flex items-center justify-center animate-pulse">
              {activeDownloadsCount}
            </span>
          )}
        </div>
      )
    },
    { id: 'bookmarks', label: t('bookmarks'), icon: <Bookmark className="w-5 h-5" /> },
    { id: 'settings', label: t('settings'), icon: <Settings className="w-5 h-5" /> }
  ];

  const handleTabClick = (tabId: NavTab) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(8);
    }
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 w-full bg-white/75 dark:bg-[#0b1411]/80 backdrop-blur-xl border-t border-white/60 dark:border-white/10 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 transition-all shadow-[0_-8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.35)]">
      <div className="max-w-2xl mx-auto grid grid-cols-5 gap-1.5 px-3">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-emerald-600/10 dark:bg-amber-400/15 text-emerald-800 dark:text-amber-300 font-bold border border-emerald-600/20 dark:border-amber-400/30 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="mb-0.5">{tab.icon}</div>
              <span className="text-[10px] tracking-tight truncate max-w-[64px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
