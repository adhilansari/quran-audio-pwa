import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, DownloadCloud, Wifi, WifiOff, Globe, Check, Palette } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_CONFIG } from '@/config';
import { ThemeMode } from '@/types';

interface NavbarProps {
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { settings, updateSetting, isInstallable, promptInstall, t } = useSettings();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

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

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeMenu]);

  const toggleLanguage = () => {
    const nextLang = settings.language === 'ml' ? 'en' : 'ml';
    updateSetting('language', nextLang);
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    updateSetting('theme', mode);
    setShowThemeMenu(false); // Automatically closes upon selection
  };

  const themeOptions: { id: ThemeMode; labelMl: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      labelMl: 'ലൈറ്റ് (ഇളം നിറം)',
      labelEn: 'Light (Warm)',
      icon: <Sun className="w-4 h-4 text-amber-500" />
    },
    {
      id: 'dark',
      labelMl: 'മരതകം (ഡാർക്ക്)',
      labelEn: 'Emerald Dark',
      icon: <Moon className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'sepia',
      labelMl: 'സെപിയ (വായന)',
      labelEn: 'Sepia (Warm)',
      icon: <span className="text-sm">📜</span>
    },
    {
      id: 'midnight',
      labelMl: 'AMOLED ബ്ലാക്ക്',
      labelEn: 'Midnight (AMOLED)',
      icon: <span className="text-sm">🖤</span>
    },
    {
      id: 'sapphire',
      labelMl: 'സഫയർ (നീലരാവ്)',
      labelEn: 'Sapphire (Navy)',
      icon: <span className="text-sm">🌌</span>
    },
    {
      id: 'amethyst',
      labelMl: 'അമത്വിസ്റ്റ് (റോയൽ)',
      labelEn: 'Royal Velvet',
      icon: <span className="text-sm">🔮</span>
    },
    {
      id: 'sage',
      labelMl: 'സേജ് (ഇളം പച്ച)',
      labelEn: 'Sage Oasis',
      icon: <span className="text-sm">🌿</span>
    },
    {
      id: 'rose',
      labelMl: 'റോസ് (മദീന പുലരി)',
      labelEn: 'Madinah Rose',
      icon: <span className="text-sm">🌸</span>
    },
    {
      id: 'system',
      labelMl: 'സിസ്റ്റം (ഓട്ടോ)',
      labelEn: 'System (Auto)',
      icon: <span className="text-sm">⚙️</span>
    }
  ];

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

          {/* Theme Selector Popover */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`p-2 rounded-lg border text-stone-700 dark:text-stone-200 transition-all flex items-center justify-center ${
                showThemeMenu
                  ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-xs'
                  : 'border-stone-200 dark:border-emerald-900 hover:bg-stone-100 dark:hover:bg-emerald-950'
              }`}
              title={settings.language === 'ml' ? 'തീം മാറ്റുക' : 'Change Theme'}
              aria-label="Select Theme"
            >
              {settings.theme === 'dark' ? (
                <Moon className="w-4 h-4 text-emerald-400" />
              ) : settings.theme === 'sepia' ? (
                <span className="text-xs">📜</span>
              ) : settings.theme === 'midnight' ? (
                <span className="text-xs">🖤</span>
              ) : settings.theme === 'sapphire' ? (
                <span className="text-xs">🌌</span>
              ) : settings.theme === 'amethyst' ? (
                <span className="text-xs">🔮</span>
              ) : settings.theme === 'sage' ? (
                <span className="text-xs">🌿</span>
              ) : settings.theme === 'rose' ? (
                <span className="text-xs">🌸</span>
              ) : settings.theme === 'system' ? (
                <span className="text-xs">⚙️</span>
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* All Themes Dropdown Menu (Auto-closes upon choosing) */}
            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-900 shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-emerald-950 flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-amber-500" />
                  <span>{settings.language === 'ml' ? 'തീം തിരഞ്ഞെടുക്കുക' : 'Select Theme'}</span>
                </div>

                {themeOptions.map((opt) => {
                  const isSelected = settings.theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectTheme(opt.id)}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-800 text-amber-300 font-bold'
                          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-emerald-950/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.icon}
                        <span className="truncate">
                          {settings.language === 'ml' ? opt.labelMl : opt.labelEn}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
