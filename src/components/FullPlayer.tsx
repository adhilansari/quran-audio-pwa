import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Repeat,
  Repeat1,
  Clock,
  BookOpen,
  Volume2,
  Loader2
} from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { useSettings } from '@/contexts/SettingsContext';
import { RepeatMode, Surah } from '@/types';

interface FullPlayerProps {
  surahs: Surah[];
  onOpenReader?: (surah: Surah, initialAyah?: number) => void;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({ surahs, onOpenReader }) => {
  const {
    currentSurah,
    isPlaying,
    isLoading,
    currentAyahNumber,
    currentTime,
    duration,
    playbackSpeed,
    repeatMode,
    isFullPlayerOpen,
    sleepTimerMinutes,
    sleepRemainingSeconds,
    togglePlay,
    seek,
    seekRelative,
    nextSurah,
    prevSurah,
    setSpeed,
    setRepeat,
    setSleepTimer,
    closeFullPlayer
  } = useAudio();

  const { settings, t } = useSettings();
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);

  const triggerHaptic = (ms = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(ms);
  };

  if (!isFullPlayerOpen || !currentSurah) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'surah', 'all'];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeat(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#063327] dark:bg-[#07130f] text-stone-100 flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={closeFullPlayer}
          className="p-2 -ml-2 rounded-full hover:bg-emerald-900/50 text-stone-300 hover:text-white transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-7 h-7" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold tracking-widest uppercase text-amber-400">
            {currentSurah.revelationType === 'Meccan' ? 'മക്കീ (Meccan)' : 'മദനീ (Medinan)'}
          </span>
          <p className="text-xs text-stone-300">Surah {currentSurah.number} of 114</p>
        </div>

        {onOpenReader ? (
          <button
            onClick={() => {
              closeFullPlayer();
              onOpenReader(currentSurah, currentAyahNumber || 1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-amber-300 text-xs font-semibold shadow transition-all"
            title="Read Translation"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('readerMode')}</span>
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Center Artwork / Calligraphic Medallion */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-tr from-emerald-900 to-emerald-800 border-2 border-amber-400/30 shadow-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          {/* Subtle geometric ring */}
          <div className="absolute inset-2 rounded-2xl border border-amber-400/15 pointer-events-none" />
          <div className="absolute inset-6 rounded-xl border border-amber-400/10 pointer-events-none" />

          {/* Arabic Title */}
          <h2 className="font-arabic text-5xl sm:text-6xl text-amber-300 mb-3 drop-shadow-md">
            {currentSurah.nameArabic}
          </h2>

          {/* Surah Names */}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {settings.language === 'ml' ? currentSurah.malayalamName : currentSurah.englishName}
          </h3>

          <p className="text-sm text-emerald-200 font-medium">
            {settings.language === 'ml' ? currentSurah.englishName : currentSurah.malayalamName}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-amber-400/20 text-xs text-amber-200">
            <span>{currentSurah.ayahCount} {t('ayahCount')}</span>
          </div>
        </div>

        {/* Translation Meaning Subtitle */}
        <p className="mt-4 text-xs sm:text-sm text-emerald-300/90 text-center max-w-xs italic">
          "{settings.language === 'ml' ? currentSurah.malayalamMeaning : currentSurah.englishMeaning}"
        </p>
      </div>

      {/* Bottom Audio Controls Container */}
      <div className="px-6 pb-10 pt-2 max-w-md mx-auto w-full">
        {/* Scrubber Range Bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-2 bg-emerald-950/90 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between items-center text-xs text-emerald-300/80 font-mono mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls: Prev, -15s, Play, +15s, Next */}
        <div className="flex items-center justify-between my-2">
          {/* Previous Surah */}
          <button
            onClick={() => {
              triggerHaptic(10);
              prevSurah(surahs);
            }}
            className="p-3 text-stone-300 hover:text-white transition-transform active:scale-90"
            title="Previous Surah"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* -15s Seek */}
          <button
            onClick={() => {
              triggerHaptic(8);
              seekRelative(-15);
            }}
            className="p-3 text-emerald-200 hover:text-amber-300 transition-transform active:scale-90"
            title="Rewind 15 seconds"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          {/* Large Center Play / Pause Gold Button */}
          <button
            onClick={() => {
              triggerHaptic(15);
              togglePlay();
            }}
            className="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-emerald-950 flex items-center justify-center shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            title={isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-950" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          {/* +15s Seek */}
          <button
            onClick={() => {
              triggerHaptic(8);
              seekRelative(15);
            }}
            className="p-3 text-emerald-200 hover:text-amber-300 transition-transform active:scale-90"
            title="Forward 15 seconds"
          >
            <RotateCw className="w-6 h-6" />
          </button>

          {/* Next Surah */}
          <button
            onClick={() => {
              triggerHaptic(10);
              nextSurah(surahs);
            }}
            className="p-3 text-stone-300 hover:text-white transition-transform active:scale-90"
            title="Next Surah"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Aux Controls: Speed, Repeat, Sleep Timer */}
        <div className="flex items-center justify-around pt-5 border-t border-emerald-900/60 mt-4 text-xs font-medium">
          {/* Playback speed modal trigger */}
          <button
            onClick={() => setShowSpeedModal(true)}
            className="flex items-center gap-1 text-emerald-300 hover:text-amber-300 py-1.5 px-3 rounded-lg bg-emerald-950/40"
          >
            <span>{playbackSpeed}x</span>
          </button>

          {/* Repeat mode */}
          <button
            onClick={cycleRepeat}
            className={`p-2 rounded-lg flex items-center gap-1 transition-colors ${
              repeatMode !== 'off'
                ? 'text-amber-300 bg-emerald-950/80 font-bold'
                : 'text-emerald-300/70 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'surah' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>

          {/* Sleep Timer */}
          <button
            onClick={() => setShowSleepModal(true)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors ${
              sleepRemainingSeconds !== null
                ? 'text-amber-300 bg-emerald-950/80 font-bold animate-pulse'
                : 'text-emerald-300/70 hover:text-white bg-emerald-950/40'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {sleepRemainingSeconds !== null
                ? formatTime(sleepRemainingSeconds)
                : t('sleepTimer')}
            </span>
          </button>
        </div>
      </div>

      {/* Sleep Timer Modal */}
      {showSleepModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#0b1e17] border border-emerald-800 text-stone-100 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" /> {t('sleepTimer')}
            </h3>
            <div className="space-y-1.5 mb-3 max-h-[40vh] overflow-y-auto no-scrollbar">
              {[
                { min: null, label: t('sleepOff') },
                { min: 15, label: t('sleep15') },
                { min: 30, label: t('sleep30') },
                { min: 45, label: t('sleep45') },
                { min: 60, label: t('sleep60') },
                { min: 90, label: settings.language === 'ml' ? '90 മിനിറ്റ് (1.5 മണിക്കൂർ)' : '90 Minutes' },
                { min: -1, label: t('sleepEndOfSurah') }
              ].map(opt => (
                <button
                  key={String(opt.min)}
                  onClick={() => {
                    triggerHaptic(12);
                    setSleepTimer(opt.min);
                    setShowSleepModal(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold transition-all ${
                    sleepTimerMinutes === opt.min
                      ? 'bg-emerald-700 text-amber-300 font-bold shadow-xs'
                      : 'hover:bg-emerald-900/60 text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Sleep Timer Slider / Selector */}
            <div className="pt-3 border-t border-emerald-900/60 space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-200 font-medium">
                  {settings.language === 'ml' ? 'കസ്റ്റം സമയം (Custom):' : 'Custom Duration:'}
                </span>
                <span className="font-bold text-amber-300">
                  {customMinutes} {settings.language === 'ml' ? 'മിനിറ്റ്' : 'min'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={180}
                value={customMinutes}
                onChange={(e) => {
                  triggerHaptic(5);
                  setCustomMinutes(parseInt(e.target.value, 10));
                }}
                className="w-full h-1.5 bg-emerald-950 rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() => {
                  triggerHaptic(14);
                  setSleepTimer(customMinutes);
                  setShowSleepModal(false);
                }}
                className="w-full py-2 rounded-xl bg-amber-400 text-emerald-950 font-bold text-xs shadow-xs hover:bg-amber-300 transition-colors"
              >
                {settings.language === 'ml'
                  ? `${customMinutes} മിനിറ്റ് ടൈമർ ഓൺ ചെയ്യുക`
                  : `Start ${customMinutes} Min Timer`}
              </button>
            </div>
            <button
              onClick={() => setShowSleepModal(false)}
              className="w-full py-2 text-center text-xs text-stone-400 hover:text-stone-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Speed Modal */}
      {showSpeedModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#0b1e17] border border-emerald-800 text-stone-100 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Volume2 className="w-5 h-5" /> {t('playbackSpeed')}
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    setShowSpeedModal(false);
                  }}
                  className={`py-2 rounded-xl text-center text-sm font-semibold transition-all ${
                    playbackSpeed === s
                      ? 'bg-emerald-700 text-amber-300 font-bold'
                      : 'bg-emerald-950/70 hover:bg-emerald-900 text-stone-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSpeedModal(false)}
              className="w-full py-2 text-center text-xs text-stone-400 hover:text-stone-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
