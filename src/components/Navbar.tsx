import React, { useState, useEffect } from 'react';
import { Moon, Sun, DownloadCloud, Wifi, WifiOff, Globe } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_CONFIG } from '@/config';

interface NavbarProps {
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { settings, updateSetting, isInstallable, promptInstall, t } = useSettings();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSetting('theme', nextTheme);
  };

  const toggleLanguage = () => {
    const nextLang = settings.language === 'ml' ? 'en' : 'ml';
    updateSetting('language', nextLang);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#faf8f5]/90 dark:bg-[#0b1411]/90 backdrop-blur-md border-b border-stone-200/80 dark:border-emerald-950/80 px-4 py-3 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand & Online Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/20 text-amber-300 font-bold text-lg">
            📖
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 dark:text-stone-50 leading-tight tracking-tight">
              {settings.language === 'ml' ? APP_CONFIG.appNameMalayalam : APP_CONFIG.appName}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-emerald-400 font-medium">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <WifiOff className="w-3 h-3" /> Offline Ready
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 text-amber-300 hover:bg-emerald-800 shadow-sm transition-all"
              title={t('installApp')}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('installApp')}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-emerald-900 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-emerald-950 transition-all"
            title="Toggle Language"
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{settings.language === 'ml' ? 'ENG' : 'മല'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-emerald-950 transition-all"
            title={t('theme')}
            aria-label={t('theme')}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
