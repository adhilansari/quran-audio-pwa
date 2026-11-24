import React, { useState, useEffect } from 'react';
import { DownloadCloud, Play, Trash2, Pause, RotateCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Surah, DownloadTask } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudio } from '@/contexts/AudioContext';
import { downloadManager } from '@/services/downloader';
import { getAllDownloads } from '@/services/db';
import { StorageManager } from '@/components/StorageManager';
import { formatBytes } from '@/services/storage';

interface DownloadsViewProps {
  surahs: Surah[];
  onOpenReader: (surah: Surah) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({ surahs }) => {
  const { t, settings } = useSettings();
  const { playSurah } = useAudio();
  const [downloadsMap, setDownloadsMap] = useState<Record<number, DownloadTask>>({});
  const [showCellularWarning, setShowCellularWarning] = useState(false);

  const refreshTasks = async () => {
    const list = await getAllDownloads();
    const map: Record<number, DownloadTask> = {};
    list.forEach(t => {
      map[t.surahId] = t;
    });
    setDownloadsMap(map);
  };

  useEffect(() => {
    refreshTasks();
    const unsub = downloadManager.subscribe((task) => {
      setDownloadsMap(prev => ({ ...prev, [task.surahId]: task }));
    });
    return () => unsub();
  }, []);

  const tasks = Object.values(downloadsMap);
  const activeDownloads = tasks.filter(t => t.status === 'downloading' || t.status === 'queued' || t.status === 'paused');
  const completedDownloads = tasks.filter(t => t.status === 'completed');

  const handleDownloadAll = () => {
    // Check if on cellular connection if API available
    const connection = (navigator as any).connection;
    const isCellular = connection && (connection.type === 'cellular' || connection.effectiveType === '4g' || connection.effectiveType === '3g');

    if (settings.warnOnCellularDownload && isCellular) {
      setShowCellularWarning(true);
      return;
    }
    downloadManager.queueBatch(surahs);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all downloaded audio files? This cannot be undone.')) {
      await downloadManager.clearAllDownloads(surahs);
      await refreshTasks();
    }
  };

  const handleDeleteSurah = async (surah: Surah) => {
    await downloadManager.deleteDownload(surah);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Storage Manager Bar */}
      <StorageManager onClearAll={completedDownloads.length > 0 ? handleClearAll : undefined} />

      {/* Batch Download All Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-amber-300">
            Download Complete Quran (114 Surahs)
          </h3>
          <p className="text-xs text-emerald-100">
            Total size: ~1.31 GB • Recommended over Wi-Fi
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-sm flex-shrink-0 transition-all active:scale-95 flex items-center gap-1.5"
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Download All</span>
        </button>
      </div>

      {/* Active Downloads Section */}
      {activeDownloads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-1">
            Active Downloads ({activeDownloads.length})
          </h3>
          <div className="space-y-2">
            {activeDownloads.map(task => {
              const surah = surahs.find(s => s.id === task.surahId);
              if (!surah) return null;

              return (
                <div
                  key={task.surahId}
                  className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-3.5 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {surah.number}. {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {formatBytes(task.downloadedBytes)} / {formatBytes(task.fileSizeBytes)} ({task.progress}%)
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {task.status === 'downloading' ? (
                        <button
                          onClick={() => downloadManager.pauseDownload(task.surahId)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => downloadManager.downloadSurah(surah)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700"
                          title="Resume"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => downloadManager.cancelDownload(surah)}
                        className="p-1.5 text-rose-500 hover:text-rose-600"
                        title="Cancel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-100 dark:bg-emerald-950/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>

                  {task.errorMessage && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {task.errorMessage}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Offline Downloads List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 px-1 flex items-center justify-between">
          <span>{t('offlineDownloaded')} ({completedDownloads.length})</span>
        </h3>

        {completedDownloads.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-6 text-stone-500">
            <DownloadCloud className="w-10 h-10 mx-auto mb-2 text-stone-300 dark:text-emerald-900" />
            <p className="text-sm font-medium">{t('noDownloads')}</p>
            <p className="text-xs mt-1">Tap the download icon on any Surah to save for offline listening.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedDownloads.map(task => {
              const surah = surahs.find(s => s.id === task.surahId);
              if (!surah) return null;

              return (
                <div
                  key={task.surahId}
                  className="bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-3.5 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {surah.number}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {formatBytes(task.fileSizeBytes)} • {surah.ayahCount} Ayahs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => playSurah(surah)}
                      className="p-2 rounded-xl bg-emerald-800 text-amber-300 hover:bg-emerald-700 transition-colors"
                      title="Play"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSurah(surah)}
                      className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cellular Warning Modal */}
      {showCellularWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1e17] rounded-2xl border border-amber-500/40 p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-white">
              {t('cellularWarningTitle')}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-normal">
              {t('cellularWarningMsg')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCellularWarning(false)}
                className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-emerald-950 rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowCellularWarning(false);
                  downloadManager.queueBatch(surahs);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
              >
                {t('proceed')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
