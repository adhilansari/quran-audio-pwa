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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#faf8f5]/95 dark:bg-[#0b1411]/95 backdrop-blur-lg border-t border-stone-200/80 dark:border-emerald-950/80 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 px-2">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 dark:text-amber-400 font-bold scale-105'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
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
