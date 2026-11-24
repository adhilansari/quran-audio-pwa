import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, ThemeMode, UILanguage, RepeatMode } from '@/types';
import { getSetting, saveSetting } from '@/services/db';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  deferredInstallPrompt: any;
  isInstallable: boolean;
  promptInstall: () => Promise<void>;
  t: (key: string) => string;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'ml',
  arabicFontSize: 28,
  malayalamFontSize: 16,
  showArabic: true,
  showMalayalam: true,
  playbackSpeed: 1.0,
  repeatMode: 'off',
  autoPlayNext: true,
  warnOnCellularDownload: true,
  persistedStorage: false
};

// UI Translations dictionary
const translations: Record<UILanguage, Record<string, string>> = {
  ml: {
    appName: "ഖുർആൻ മലയാളം ഓഡിയോ",
    home: "ഹോം",
    surahs: "സൂറത്തുകൾ",
    downloads: "ഡൗൺലോഡുകൾ",
    bookmarks: "ബുക്ക്മാർക്കുകൾ",
    settings: "ക്രമീകരണങ്ങൾ",
    searchPlaceholder: "സൂറത്ത് തിരയുക (മലയാളം, English, العربية)...",
    allSurahs: "എല്ലാ സൂറത്തുകളും",
    offlineDownloaded: "ഡൗൺലോഡ് ചെയ്തവ",
    ayahCount: "ആയത്തുകൾ",
    size: "വലിപ്പം",
    download: "ഡൗൺലോഡ്",
    downloading: "ഡൗൺലോഡിംഗ്...",
    downloaded: "ഡൗൺലോഡ് ചെയ്തു",
    cancel: "റദ്ദാക്കുക",
    pause: "താൽക്കാലികമായി നിർത്തുക",
    resume: "തുടരുക",
    retry: "വീണ്ടും ശ്രമിക്കുക",
    delete: "മായ്ക്കുക",
    clearAll: "എല്ലാം മായ്ക്കുക",
    continueListening: "കേൾക്കുന്നത് തുടരുക",
    dailyAyah: "ഇന്നത്തെ വചനം",
    quickAccess: "പ്രധാന സൂറത്തുകൾ",
    storageUsed: "ഉപയോഗിച്ച സംഭരണശേഷി",
    storageAvailable: "ലഭ്യമായ സംഭരണം",
    enablePersistence: "സംഭരണ സംരക്ഷണം ഉറപ്പാക്കുക",
    persistedActive: "സംഭരണ സംരക്ഷണം സജീവമാണ്",
    theme: "തീം (Appearance)",
    themeSystem: "സിസ്റ്റം",
    themeLight: "ലൈറ്റ് (Light)",
    themeDark: "എമറാൾഡ് (Dark)",
    themeSepia: "സെപിയ (Sepia)",
    themeMidnight: "മിഡ്നൈറ്റ് (AMOLED)",
    builtBy: "നിർമ്മാണം (Developed by)",
    supportProject: "സഹായിക്കുക (Support)",
    portfolio: "പോർട്ട്ഫോളിയോ",
    language: "ഭാഷ (Language)",
    arabicSize: "അറബിക് ഫോണ്ട് വലിപ്പം",
    malayalamSize: "മലയാളം ഫോണ്ട് വലിപ്പം",
    displaySettings: "വായനാ ക്രമീകരണങ്ങൾ",
    showArabicText: "അറബിക് കാണിക്കുക",
    showMalayalamText: "മലയാള പരിഭാഷ കാണിക്കുക",
    playbackSpeed: "പ്ലേബാക്ക് വേഗത",
    sleepTimer: "സ്ലീപ്പ് ടൈമർ",
    sleepOff: "ഓഫ്",
    sleep15: "15 മിനിറ്റ്",
    sleep30: "30 മിനിറ്റ്",
    sleep45: "45 മിനിറ്റ്",
    sleep60: "60 മിനിറ്റ്",
    sleepEndOfSurah: "സൂറത്ത് തീരുമ്പോൾ",
    credits: "കടപ്പാട് & വിവരങ്ങൾ",
    reciter: "പാരായണം (ഖാരിഅ്)",
    translator: "മലയാള പരിഭാഷ",
    voice: "ശബ്ദം",
    installApp: "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക",
    appInstalled: "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തിരിക്കുന്നു",
    offlineNotice: "ഇന്റർനെറ്റ് ഇല്ല. ഡൗൺലോഡ് ചെയ്ത സൂറത്തുകൾ ലഭ്യമാണ്.",
    cellularWarningTitle: "മൊബൈൽ ഡാറ്റ മുന്നറിയിപ്പ്",
    cellularWarningMsg: "നിങ്ങൾ മൊബൈൽ ഡാറ്റയിലാണ്. വലിയ ഓഡിയോ ഫയലുകൾ ഡൗൺലോഡ് ചെയ്യുമ്പോൾ Wi-Fi ഉപയോഗിക്കാൻ ശുപാർശ ചെയ്യുന്നു. തുടരണോ?",
    proceed: "തുടരുക",
    noBookmarks: "ബുക്ക്മാർക്കുകൾ ഒന്നും ചേർത്തിട്ടില്ല",
    noDownloads: "ഓഫ്‌ലൈനായി സൂറത്തുകൾ ഒന്നും ഡൗൺലോഡ് ചെയ്തിട്ടില്ല",
    readerMode: "വായനാ രൂപം",
    listenAudio: "ഓഡിയോ കേൾക്കുക"
  },
  en: {
    appName: "Quran Malayalam Audio",
    home: "Home",
    surahs: "Surahs",
    downloads: "Downloads",
    bookmarks: "Bookmarks",
    settings: "Settings",
    searchPlaceholder: "Search surahs (English, Malayalam, Arabic)...",
    allSurahs: "All Surahs",
    offlineDownloaded: "Downloaded (Offline)",
    ayahCount: "Ayahs",
    size: "Size",
    download: "Download",
    downloading: "Downloading...",
    downloaded: "Downloaded",
    cancel: "Cancel",
    pause: "Pause",
    resume: "Resume",
    retry: "Retry",
    delete: "Delete",
    clearAll: "Clear All",
    continueListening: "Continue Listening",
    dailyAyah: "Daily Ayah",
    quickAccess: "Quick Access",
    storageUsed: "Storage Used",
    storageAvailable: "Storage Available",
    enablePersistence: "Request Storage Persistence",
    persistedActive: "Storage Persistence Active",
    theme: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Emerald Dark",
    themeSepia: "Sepia (Warm)",
    themeMidnight: "Midnight (AMOLED)",
    builtBy: "Built by",
    supportProject: "Buy Me a Coffee",
    portfolio: "Portfolio",
    language: "Language",
    arabicSize: "Arabic Font Size",
    malayalamSize: "Malayalam Font Size",
    displaySettings: "Reading Preferences",
    showArabicText: "Show Arabic Text",
    showMalayalamText: "Show Malayalam Translation",
    playbackSpeed: "Playback Speed",
    sleepTimer: "Sleep Timer",
    sleepOff: "Off",
    sleep15: "15 min",
    sleep30: "30 min",
    sleep45: "45 min",
    sleep60: "60 min",
    sleepEndOfSurah: "End of Surah",
    credits: "Credits & Info",
    reciter: "Recitation (Qari)",
    translator: "Malayalam Translation",
    voice: "Voice",
    installApp: "Install App",
    appInstalled: "App is Installed",
    offlineNotice: "You are offline. Only downloaded Surahs are playable.",
    cellularWarningTitle: "Cellular Data Warning",
    cellularWarningMsg: "You are connected via cellular data. Downloading full surahs may consume mobile data. Proceed anyway?",
    proceed: "Proceed",
    noBookmarks: "No bookmarks saved yet",
    noDownloads: "No offline surahs downloaded yet",
    readerMode: "Reader View",
    listenAudio: "Listen Audio"
  }
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Load settings on startup
  useEffect(() => {
    async function load() {
      const keys = Object.keys(defaultSettings) as (keyof AppSettings)[];
      const loaded: any = { ...defaultSettings };
      for (const k of keys) {
        loaded[k] = await getSetting(k, defaultSettings[k]);
      }
      setSettings(loaded);
    }
    load();
  }, []);

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'sepia', 'midnight', 'light');

    let activeTheme = settings.theme;
    if (activeTheme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else if (activeTheme === 'sepia') {
      root.classList.add('sepia');
    } else if (activeTheme === 'midnight') {
      root.classList.add('dark', 'midnight');
    } else {
      root.classList.add('light');
    }
  }, [settings.theme]);

  // Capture PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSetting(key, value);
      return next;
    });
  };

  const promptInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredInstallPrompt(null);
  };

  const t = (key: string): string => {
    const lang = settings.language || 'ml';
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        deferredInstallPrompt,
        isInstallable,
        promptInstall,
        t
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
