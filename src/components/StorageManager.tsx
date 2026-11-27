import React, { useState, useEffect } from 'react';
import { HardDrive, ShieldCheck, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { getStorageEstimate, requestStoragePersistence, formatBytes, StorageEstimateResult } from '@/services/storage';
import { useSettings } from '@/contexts/SettingsContext';
import { downloadManager } from '@/services/downloader';
import surahsData from '@/data/surahs.json';
import { Surah } from '@/types';

interface StorageManagerProps {
  onClearAll?: () => void;
}

export const StorageManager: React.FC<StorageManagerProps> = ({ onClearAll }) => {
  const { settings } = useSettings();
  const [storage, setStorage] = useState<StorageEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshEstimate = async () => {
    setLoading(true);
    const res = await getStorageEstimate();
    setStorage(res);
    setLoading(false);
  };

  useEffect(() => {
    refreshEstimate();
  }, []);

  const handleRequestPersistence = async () => {
    const success = await requestStoragePersistence();
    await refreshEstimate();
    if (success) {
      alert(settings.language === 'ml' 
        ? 'സംഭരണ സംരക്ഷണം ഉറപ്പാക്കി. ബ്രൗസർ ഓഡിയോ തനിയെ നീക്കം ചെയ്യില്ല.' 
        : 'Persistent storage granted. Browser will not purge downloaded audio.');
    } else {
      alert(settings.language === 'ml'
        ? 'സംഭരണ സംരക്ഷണം ബ്രൗസർ അനുവദിച്ചില്ല.'
        : 'Persistent storage request returned false or is not supported by your browser.');
    }
  };

  const handleClear = async () => {
    if (onClearAll) {
      onClearAll();
      await refreshEstimate();
      return;
    }
    const msg = settings.language === 'ml'
      ? 'ഡൗൺലോഡ് ചെയ്ത എല്ലാ ഓഡിയോ ഫയലുകളും ഒഴിവാക്കണോ? ഇത് പിന്നീട് വീണ്ടും ഡൗൺലോഡ് ചെയ്യേണ്ടി വരും.'
      : 'Are you sure you want to delete all downloaded audio files?';
    if (confirm(msg)) {
      setLoading(true);
      await downloadManager.clearAllDownloads(surahsData as Surah[]);
      await refreshEstimate();
      setLoading(false);
    }
  };

  if (!storage) return null;

  // Complete Quran audio total size reference is ~1.31 GB (114 Surahs)
  const fullQuranBytes = 1.31 * 1024 * 1024 * 1024;
  const quranDownloadPercent = Math.min(100, Math.round((storage.usageBytes / fullQuranBytes) * 100));
  const hasDownloadedAudio = storage.usageBytes > 1024 * 50; // more than 50 KB

  return (
    <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-amber-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              {settings.language === 'ml' ? 'ഓഫ്‌ലൈൻ സംഭരണം' : 'Offline Audio Storage'}
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {hasDownloadedAudio
                ? settings.language === 'ml' ? 'ഓഫ്‌ലൈൻ ഓഡിയോ ഫയലുകൾ സേവ് ചെയ്തു' : 'Downloaded audio saved on device'
                : settings.language === 'ml' ? 'ഓഡിയോകൾ ഒന്നും ഡൗൺലോഡ് ചെയ്തിട്ടില്ല' : 'No offline audio downloaded yet'}
            </p>
          </div>
        </div>
        <button
          onClick={refreshEstimate}
          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950 transition-colors"
          title="Refresh storage"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Real Usage Progress Display */}
      <div className="bg-stone-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-stone-100 dark:border-emerald-900/60 space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-800 dark:text-amber-300">
              {formatBytes(storage.usageBytes)}
            </span>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {settings.language === 'ml' ? 'ഉപയോഗിച്ചു' : 'used'}
            </span>
          </div>
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            {settings.language === 'ml' ? 'മുഴുവൻ ഖുർആൻ: ~1.31 GB' : 'Full Quran: ~1.31 GB'}
          </span>
        </div>

        {/* Progress Bar showing how much of Quran is downloaded */}
        <div className="w-full bg-stone-200/80 dark:bg-emerald-900/40 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 dark:bg-amber-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(hasDownloadedAudio ? 2 : 0, quranDownloadPercent)}%` }}
          />
        </div>
      </div>

      {/* Persistence Protection Status */}
      <div className="pt-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck
            className={`w-4 h-4 flex-shrink-0 ${
              storage.isPersisted
                ? 'text-emerald-600 dark:text-amber-400'
                : 'text-stone-400'
            }`}
          />
          <div className="min-w-0">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block truncate">
              {storage.isPersisted
                ? settings.language === 'ml' ? 'സംഭരണ സംരക്ഷണം ഉറപ്പാക്കി' : 'Persistent Storage Active'
                : settings.language === 'ml' ? 'സംഭരണ സംരക്ഷണം ഉറപ്പാക്കുക' : 'Enable Storage Protection'}
            </span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
              {storage.isPersisted
                ? settings.language === 'ml' ? 'ഫോൺ ഓഡിയോ തനിയെ നീക്കം ചെയ്യില്ല' : 'OS will not purge downloaded audio'
                : settings.language === 'ml' ? 'മെമ്മറി കുറയുമ്പോൾ ഡിലീറ്റ് ആകാതിരിക്കാൻ' : 'Prevents browser from auto-clearing'}
            </span>
          </div>
        </div>

        {!storage.isPersisted ? (
          <button
            onClick={handleRequestPersistence}
            className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300 font-semibold hover:bg-emerald-200 transition-colors flex-shrink-0 text-xs"
          >
            Enable
          </button>
        ) : (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-amber-400 flex items-center gap-1 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active</span>
          </span>
        )}
      </div>

      {/* Clear All Option */}
      {hasDownloadedAudio && (
        <div className="pt-2 border-t border-stone-100 dark:border-emerald-950/80 flex justify-end">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{settings.language === 'ml' ? 'ഓഡിയോ ക്ലിയർ ചെയ്യുക' : 'Clear Downloaded Audio'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
