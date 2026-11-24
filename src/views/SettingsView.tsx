import React from 'react';
import {
  Moon,
  Sun,
  Globe,
  Type,
  Volume2,
  HardDrive,
  Info,
  DownloadCloud,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_CONFIG } from '@/config';
import { StorageManager } from '@/components/StorageManager';
import { ThemeMode, UILanguage } from '@/types';

export const SettingsView: React.FC = () => {
  const { settings, updateSetting, isInstallable, promptInstall, t } = useSettings();

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: t('themeSystem'), icon: <span className="text-xs">⚙️</span> },
    { id: 'light', label: t('themeLight'), icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { id: 'dark', label: t('themeDark'), icon: <Moon className="w-4 h-4 text-emerald-400" /> }
  ];

  const languages: { id: UILanguage; label: string }[] = [
    { id: 'ml', label: 'മലയാളം (Malayalam)' },
    { id: 'en', label: 'English' }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Appearance / Theme */}
      <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>{t('theme')}</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(th => (
            <button
              key={th.id}
              onClick={() => updateSetting('theme', th.id)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                settings.theme === th.id
                  ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-sm font-bold'
                  : 'bg-stone-50 dark:bg-emerald-950/40 border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              {th.icon}
              <span>{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Language */}
      <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
          <span>{t('language')}</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => updateSetting('language', lang.id)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                settings.language === lang.id
                  ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-sm font-bold'
                  : 'bg-stone-50 dark:bg-emerald-950/40 border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Typography & Display Preferences */}
      <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
          <span>{t('displaySettings')}</span>
        </h3>

        {/* Arabic Font Slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
            <span>{t('arabicSize')}</span>
            <span>{settings.arabicFontSize}px</span>
          </div>
          <input
            type="range"
            min={22}
            max={40}
            value={settings.arabicFontSize}
            onChange={(e) => updateSetting('arabicFontSize', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-stone-200 dark:bg-emerald-950 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Malayalam Font Slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
            <span>{t('malayalamSize')}</span>
            <span>{settings.malayalamFontSize}px</span>
          </div>
          <input
            type="range"
            min={13}
            max={22}
            value={settings.malayalamFontSize}
            onChange={(e) => updateSetting('malayalamFontSize', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-stone-200 dark:bg-emerald-950 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Audio Preferences */}
      <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
          <span>Audio Playback</span>
        </h3>

        <div className="flex items-center justify-between py-1 text-xs">
          <span className="font-medium text-stone-700 dark:text-stone-300">
            Auto-play Next Surah
          </span>
          <input
            type="checkbox"
            checked={settings.autoPlayNext}
            onChange={(e) => updateSetting('autoPlayNext', e.target.checked)}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-1 text-xs border-t border-stone-100 dark:border-emerald-950">
          <span className="font-medium text-stone-700 dark:text-stone-300">
            Warn before Cellular Download
          </span>
          <input
            type="checkbox"
            checked={settings.warnOnCellularDownload}
            onChange={(e) => updateSetting('warnOnCellularDownload', e.target.checked)}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </div>
      </div>

      {/* 5. Storage Manager Card */}
      <StorageManager />

      {/* 6. PWA Install */}
      {isInstallable && (
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-amber-300">{t('installApp')}</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Add to Home Screen for fast, full offline access.
            </p>
          </div>
          <button
            onClick={promptInstall}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-emerald-950 font-bold text-xs shadow-sm hover:bg-amber-300 transition-all"
          >
            Install
          </button>
        </div>
      )}

      {/* 7. About & Credits */}
      <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm text-xs space-y-2 text-stone-600 dark:text-stone-400">
        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
          <span>{t('credits')}</span>
        </h3>

        <div className="flex justify-between py-1 border-b border-stone-100 dark:border-emerald-950">
          <span className="font-semibold text-stone-700 dark:text-stone-300">{t('reciter')}:</span>
          <span>{APP_CONFIG.credits.reciter}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-stone-100 dark:border-emerald-950">
          <span className="font-semibold text-stone-700 dark:text-stone-300">{t('translator')}:</span>
          <span className="text-right">{APP_CONFIG.credits.malayalamTranslation}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-stone-100 dark:border-emerald-950">
          <span className="font-semibold text-stone-700 dark:text-stone-300">Version:</span>
          <span>v{APP_CONFIG.version} (PWA Edition)</span>
        </div>

        <p className="pt-2 text-center text-stone-400 dark:text-stone-500 italic">
          Built for offline listening and daily contemplation. Free and open.
        </p>
      </div>
    </div>
  );
};
