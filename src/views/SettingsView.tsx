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
  Heart,
  ExternalLink,
  Sparkles,
  BookOpen,
  Share,
  Smartphone
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_CONFIG } from '@/config';
import { StorageManager } from '@/components/StorageManager';
import { ThemeMode, UILanguage } from '@/types';

export const SettingsView: React.FC = () => {
  const { settings, updateSetting, isInstallable, isIOS, isStandalone, promptInstall, t } = useSettings();

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: t('themeSystem'), icon: <span className="text-xs">⚙️</span> },
    { id: 'light', label: t('themeLight'), icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'dark', label: t('themeDark'), icon: <Moon className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'sepia', label: t('themeSepia'), icon: <span className="text-xs">👁️</span> },
    { id: 'midnight', label: t('themeMidnight'), icon: <span className="text-xs">🖤</span> },
    { id: 'sapphire', label: t('themeSapphire'), icon: <span className="text-xs">🌌</span> },
    { id: 'glassDark', label: t('themeGlassDark'), icon: <span className="text-xs">💎</span> }
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
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t('theme')}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {themes.map(th => (
            <button
              key={th.id}
              onClick={() => updateSetting('theme', th.id)}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                settings.theme === th.id
                  ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-sm font-bold scale-[1.02]'
                  : 'bg-stone-50 dark:bg-emerald-950/40 border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              {th.icon}
              <span className="truncate">{th.label}</span>
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

        {/* Arabic Font Selection */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
            <span>{t('arabicSize')}</span>
            <span className="font-bold text-emerald-700 dark:text-amber-400">
              {settings.arabicFontSize <= 24 ? (settings.language === 'ml' ? 'ചെറുത് (24px)' : 'Small (24px)') :
               settings.arabicFontSize <= 28 ? (settings.language === 'ml' ? 'സാധാരണ (28px)' : 'Normal (28px)') :
               settings.arabicFontSize <= 32 ? (settings.language === 'ml' ? 'ഇടത്തരം (32px)' : 'Medium (32px)') :
               settings.arabicFontSize <= 36 ? (settings.language === 'ml' ? 'വലുത് (36px)' : 'Large (36px)') :
               (settings.language === 'ml' ? 'കൂടുതൽ (42px)' : 'Huge (42px)')}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full bg-stone-100/70 dark:bg-emerald-950/30 p-1 rounded-2xl border border-stone-200/60 dark:border-emerald-900/60">
            {[
              { size: 24, labelMl: 'ചെറുത്', labelEn: 'Small' },
              { size: 28, labelMl: 'സാധാരണ', labelEn: 'Normal' },
              { size: 32, labelMl: 'ഇടത്തരം', labelEn: 'Medium' },
              { size: 36, labelMl: 'വലുത്', labelEn: 'Large' },
              { size: 42, labelMl: 'കൂടുതൽ', labelEn: 'Huge' }
            ].map(opt => (
              <button
                key={opt.size}
                onClick={() => {
                  if ('vibrate' in navigator) navigator.vibrate(8);
                  updateSetting('arabicFontSize', opt.size);
                }}
                className={`min-w-0 w-full py-2 px-0.5 rounded-xl text-center text-[10.5px] sm:text-xs font-bold truncate transition-all border ${
                  settings.arabicFontSize === opt.size
                    ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-emerald-950/50 border-stone-200/80 dark:border-emerald-900/80 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                }`}
                title={settings.language === 'ml' ? opt.labelMl : opt.labelEn}
              >
                {settings.language === 'ml' ? opt.labelMl : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Malayalam Font Selection */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
            <span>{t('malayalamSize')}</span>
            <span className="font-bold text-emerald-700 dark:text-amber-400">
              {settings.malayalamFontSize <= 14 ? (settings.language === 'ml' ? 'ചെറുത് (14px)' : 'Small (14px)') :
               settings.malayalamFontSize <= 16 ? (settings.language === 'ml' ? 'സാധാരണ (16px)' : 'Normal (16px)') :
               settings.malayalamFontSize <= 18 ? (settings.language === 'ml' ? 'ഇടത്തരം (18px)' : 'Medium (18px)') :
               settings.malayalamFontSize <= 20 ? (settings.language === 'ml' ? 'വലുത് (20px)' : 'Large (20px)') :
               (settings.language === 'ml' ? 'കൂടുതൽ (22px)' : 'Huge (22px)')}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full bg-stone-100/70 dark:bg-emerald-950/30 p-1 rounded-2xl border border-stone-200/60 dark:border-emerald-900/60">
            {[
              { size: 14, labelMl: 'ചെറുത്', labelEn: 'Small' },
              { size: 16, labelMl: 'സാധാരണ', labelEn: 'Normal' },
              { size: 18, labelMl: 'ഇടത്തരം', labelEn: 'Medium' },
              { size: 20, labelMl: 'വലുത്', labelEn: 'Large' },
              { size: 22, labelMl: 'കൂടുതൽ', labelEn: 'Huge' }
            ].map(opt => (
              <button
                key={opt.size}
                onClick={() => {
                  if ('vibrate' in navigator) navigator.vibrate(8);
                  updateSetting('malayalamFontSize', opt.size);
                }}
                className={`min-w-0 w-full py-2 px-0.5 rounded-xl text-center text-[10.5px] sm:text-xs font-bold truncate transition-all border ${
                  settings.malayalamFontSize === opt.size
                    ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-emerald-950/50 border-stone-200/80 dark:border-emerald-900/80 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                }`}
                title={settings.language === 'ml' ? opt.labelMl : opt.labelEn}
              >
                {settings.language === 'ml' ? opt.labelMl : opt.labelEn}
              </button>
            ))}
          </div>
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

      {/* 6. PWA Install & iOS Add-to-Home-Screen Guidance */}
      {isStandalone ? (
        <div className="bg-emerald-900/40 border border-emerald-700/50 text-emerald-200 rounded-2xl p-3.5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-emerald-300 block">{t('appInstalled')}</span>
            <span>നേറ്റീവ് ആപ്പ് മോഡ് സജീവമാണ്. ഓഫ്‌ലൈൻ ഉപയോഗത്തിന് സജ്ജം.</span>
          </div>
        </div>
      ) : isIOS ? (
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl p-4 shadow-md border border-amber-400/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-300">
                {settings.language === 'ml' ? 'iPhone-ൽ നേറ്റീവ് ആപ്പായി മാറ്റാം' : 'Install on iPhone (Native Mode)'}
              </h3>
              <p className="text-[11px] text-stone-300">
                {settings.language === 'ml' 
                  ? 'താഴത്തെ വെബ്‌സൈറ്റ് ബാർ ഒഴിവാക്കി ഫുൾസ്ക്രീൻ ആപ്പാക്കാൻ:' 
                  : 'To hide the Safari bottom bar & enjoy full-screen:'}
              </p>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 text-xs space-y-2 text-stone-200 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
              <span>Safari-ൽ താഴെയുള്ള <strong className="text-amber-300 font-semibold">Share</strong> (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" />) ബട്ടൺ ടാപ്പ് ചെയ്യുക.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
              <span>താഴേക്ക് നീക്കി <strong className="text-white font-semibold">"Add to Home Screen"</strong> തിരഞ്ഞെടുക്കുക.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
              <span>മുകളിൽ വലതുവശത്ത് <strong className="text-emerald-400 font-semibold">"Add"</strong> അമർത്തുക. ആപ്പ് റെഡി!</span>
            </div>
          </div>
        </div>
      ) : isInstallable ? (
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
      ) : null}

      {/* 7. Developer & Support */}
      <div className="bg-gradient-to-br from-stone-50 via-white to-amber-50/50 dark:from-[#0d1714] dark:via-[#12201c] dark:to-[#172b25] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-sm">
              <Heart className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Built with ❤️ by
              </div>
              <div className="text-sm font-bold text-stone-900 dark:text-amber-300">
                {APP_CONFIG.credits.developer}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Free & Open
          </span>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          For bug reports, questions, feedback, or further project updates:
        </p>

        <div className="pt-0.5">
          <a
            href={APP_CONFIG.credits.developerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-emerald-950/60 border border-stone-200 dark:border-emerald-900 text-stone-800 dark:text-stone-200 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-amber-300 transition-all shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-amber-400" />
            <span>adhilansari.vercel.app</span>
          </a>
        </div>
      </div>

      {/* 8. About & Credits */}
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
