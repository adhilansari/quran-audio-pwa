import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Maximize2, Loader2 } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { useSettings } from '@/contexts/SettingsContext';

interface MiniPlayerProps {
  hasBottomNav?: boolean;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ hasBottomNav = true }) => {
  const {
    currentSurah,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    seekRelative,
    openFullPlayer,
    isFullPlayerOpen
  } = useAudio();
  const { settings } = useSettings();

  if (!currentSurah || isFullPlayerOpen) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={openFullPlayer}
      className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-2xl z-40 bg-emerald-900/95 dark:bg-[#12201c]/95 text-stone-100 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-md border border-emerald-700/60 dark:border-emerald-800/60 cursor-pointer overflow-hidden transition-all hover:bg-emerald-900 dark:hover:bg-[#12201c] ${
        hasBottomNav
          ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]'
          : 'bottom-[calc(0.75rem+env(safe-area-inset-bottom))]'
      }`}
    >
      {/* Top micro progress bar */}
      <div className="w-full bg-emerald-950/60 h-1">
        <div
          className="bg-amber-400 h-1 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Surah number badge & Titles */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-sm flex-shrink-0">
            {currentSurah.number}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate text-white">
                {settings.language === 'ml' ? currentSurah.malayalamName : currentSurah.englishName}
              </span>
              <span className="font-arabic text-amber-200 text-xs truncate opacity-90">
                {currentSurah.nameArabic}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 truncate">
              {settings.language === 'ml' ? currentSurah.englishName : currentSurah.malayalamName} • {currentSurah.ayahCount} Ayahs
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div
          className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()} // Prevent opening full player when pressing buttons
        >
          {/* -15s Seek */}
          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(8);
              seekRelative(-15);
            }}
            className="p-1.5 text-emerald-200 hover:text-amber-300 transition-colors active:scale-90"
            title="Rewind 15 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(12);
              togglePlay();
            }}
            className="w-10 h-10 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-md hover:bg-amber-300 active:scale-95 transition-all"
            title={isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-950" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* +15s Seek */}
          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(8);
              seekRelative(15);
            }}
            className="p-1.5 text-emerald-200 hover:text-amber-300 transition-colors active:scale-90"
            title="Forward 15 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Expand icon */}
          <button
            onClick={openFullPlayer}
            className="p-1.5 text-emerald-300/70 hover:text-white transition-colors"
            title="Expand Full Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
