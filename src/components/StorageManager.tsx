import React, { useState, useEffect } from 'react';
import { Database, HardDrive, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import { getStorageEstimate, requestStoragePersistence, formatBytes, StorageEstimateResult } from '@/services/storage';
import { useSettings } from '@/contexts/SettingsContext';

interface StorageManagerProps {
  onClearAll?: () => void;
}

export const StorageManager: React.FC<StorageManagerProps> = ({ onClearAll }) => {
  const { t } = useSettings();
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
      alert('Persistent storage granted. Browser will not purge downloaded audio.');
    } else {
      alert('Persistent storage request returned false or is not supported by your browser.');
    }
  };

  if (!storage) return null;

  return (
    <div className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-700 dark:text-amber-400" />
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
            {t('storageUsed')}
          </h3>
        </div>
        <button
          onClick={refreshEstimate}
          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          title="Refresh storage"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-stone-100 dark:bg-emerald-950/80 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 dark:bg-amber-400 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(1, storage.percentageUsed)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
          <span>{formatBytes(storage.usageBytes)} used</span>
          <span>{formatBytes(storage.quotaBytes)} available</span>
        </div>
      </div>

      {/* Persistence status */}
      <div className="pt-3 border-t border-stone-100 dark:border-emerald-950/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <ShieldCheck
            className={`w-4 h-4 ${
              storage.isPersisted
                ? 'text-emerald-600 dark:text-amber-400'
                : 'text-stone-400'
            }`}
          />
          <span className="text-stone-600 dark:text-stone-300">
            {storage.isPersisted ? t('persistedActive') : t('enablePersistence')}
          </span>
        </div>

        {!storage.isPersisted && (
          <button
            onClick={handleRequestPersistence}
            className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300 font-semibold hover:bg-emerald-200 transition-colors"
          >
            Enable
          </button>
        )}
      </div>

      {/* Clear all downloads option */}
      {onClearAll && (
        <div className="pt-3 mt-3 border-t border-stone-100 dark:border-emerald-950/80 flex justify-end">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('clearAll')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
