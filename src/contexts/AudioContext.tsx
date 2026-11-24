import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Surah, RepeatMode, AyahTiming } from '@/types';
import { APP_CONFIG } from '@/config';
import { savePlayHistory, getSurahHistory } from '@/services/db';
import { downloadManager } from '@/services/downloader';
import { useSettings } from './SettingsContext';

interface AudioContextType {
  currentSurah: Surah | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  currentAyahNumber: number | null;
  activeTimings: AyahTiming[] | null;
  isFullPlayerOpen: boolean;
  sleepTimerMinutes: number | null;
  sleepRemainingSeconds: number | null;
  errorMessage: string | null;

  playSurah: (surah: Surah, startTime?: number) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  seekRelative: (deltaSeconds: number) => void;
  nextSurah: (surahs: Surah[]) => void;
  prevSurah: (surahs: Surah[]) => void;
  setSpeed: (speed: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  setSleepTimer: (minutes: number | null) => void;
  clearError: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSetting } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(settings.playbackSpeed || 1.0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(settings.repeatMode || 'off');
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timings & Highlight
  const [activeTimings, setActiveTimings] = useState<AyahTiming[] | null>(null);
  const activeTimingsRef = useRef<AyahTiming[] | null>(null);
  const [currentAyahNumber, setCurrentAyahNumber] = useState<number | null>(null);

  // Keep ref in sync without re-triggering audio recreation
  useEffect(() => {
    activeTimingsRef.current = activeTimings;
  }, [activeTimings]);

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutesState] = useState<number | null>(null);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);
  const sleepIntervalRef = useRef<any>(null);

  // Initialize HTML5 Audio once and preserve across lifecycle
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Calculate buffered progress
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }

      // Update current Ayah based on timing from ref
      const timings = activeTimingsRef.current;
      if (timings && timings.length > 0) {
        const found = timings.find(
          t => audio.currentTime >= t.start && audio.currentTime < t.end
        );
        if (found) {
          setCurrentAyahNumber(found.ayah);
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
      setErrorMessage(null);
      updateMediaSessionPosition();
    };

    const onLoadStart = () => {
      setIsLoading(true);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      updateMediaSessionState('playing');
    };

    const onPlay = () => {
      setIsPlaying(true);
      updateMediaSessionState('playing');
    };

    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
      updateMediaSessionState('paused');
    };

    const onEnded = () => {
      setIsLoading(false);
      handleAudioEnded();
    };

    const onError = (e: any) => {
      console.warn('Audio playback error:', e);
      setIsPlaying(false);
      setIsLoading(false);
      const mediaErr = audio.error;
      if (mediaErr) {
        console.warn('MediaError code:', mediaErr.code, mediaErr.message);
      }
      if (!navigator.onLine) {
        setErrorMessage('Cannot play audio: Device is offline and this Surah is not downloaded.');
      } else {
        setErrorMessage('Failed to stream audio. Please check network connection or R2 URL.');
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  // Periodic position persistence (every 3 seconds)
  useEffect(() => {
    if (!isPlaying || !currentSurah) return;

    const interval = setInterval(() => {
      if (audioRef.current && currentSurah) {
        savePlayHistory({
          surahId: currentSurah.id,
          position: audioRef.current.currentTime,
          duration: audioRef.current.duration || 0,
          lastPlayedAt: Date.now()
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSurah]);

  // Setup Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSurah) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${currentSurah.number}. ${currentSurah.englishName} (${currentSurah.malayalamName})`,
      artist: APP_CONFIG.credits.reciter,
      album: APP_CONFIG.appName,
      artwork: [
        { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => resume());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      seekRelative(-(details.seekOffset || 15));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      seekRelative(details.seekOffset || 15);
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [currentSurah]);

  const updateMediaSessionState = (state: 'playing' | 'paused') => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  };

  const updateMediaSessionPosition = () => {
    if ('mediaSession' in navigator && audioRef.current && audioRef.current.duration) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audioRef.current.duration || 0,
          playbackRate: audioRef.current.playbackRate || 1,
          position: audioRef.current.currentTime || 0
        });
      } catch (e) {
        // Ignore edge cases
      }
    }
  };

  // Load optional ayah timings
  const loadTimings = async (surahId: number) => {
    try {
      const res = await fetch(`/data/timings/${surahId}.json`);
      if (res.ok) {
        const data = await res.json();
        setActiveTimings(data);
      } else {
        setActiveTimings(null);
      }
    } catch {
      setActiveTimings(null);
    }
  };

  const playSurah = async (surah: Surah, startTime?: number) => {
    if (!audioRef.current) return;
    setErrorMessage(null);
    setIsLoading(true);

    const isSameSurah = currentSurah?.id === surah.id;

    if (!isSameSurah) {
      setCurrentSurah(surah);
      loadTimings(surah.id);

      // Check audio URL
      const url = downloadManager.getAudioUrl(surah);
      audioRef.current.src = url;
      audioRef.current.playbackRate = playbackSpeed;

      // Resume position from history if no explicit start time given
      let startPos = startTime;
      if (startPos === undefined) {
        const history = await getSurahHistory(surah.id);
        if (history && history.position > 5 && history.position < (history.duration - 10)) {
          startPos = history.position;
        }
      }

      if (startPos && startPos > 0) {
        audioRef.current.currentTime = startPos;
      }
    } else if (startTime !== undefined) {
      audioRef.current.currentTime = startTime;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.warn('Play was prevented or failed:', err);
      setIsLoading(false);
      setIsPlaying(false);
      if (!navigator.onLine) {
        setErrorMessage('Cannot stream audio while offline. Download this Surah to listen offline.');
      } else {
        setErrorMessage(err.message || 'Could not start audio playback.');
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSurah) return;
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
      if (currentSurah) {
        savePlayHistory({
          surahId: currentSurah.id,
          position: audioRef.current.currentTime,
          duration: audioRef.current.duration || 0,
          lastPlayedAt: Date.now()
        });
      }
    }
  };

  const resume = () => {
    if (audioRef.current) {
      setIsLoading(true);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(err => {
        console.warn('Resume failed:', err);
        setIsLoading(false);
      });
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      const clamped = Math.max(0, Math.min(seconds, audioRef.current.duration || 0));
      audioRef.current.currentTime = clamped;
      setCurrentTime(clamped);
      updateMediaSessionPosition();
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    if (audioRef.current) {
      seek(audioRef.current.currentTime + deltaSeconds);
    }
  };

  const setSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    updateSetting('playbackSpeed', speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      updateMediaSessionPosition();
    }
  };

  const setRepeat = (mode: RepeatMode) => {
    setRepeatMode(mode);
    updateSetting('repeatMode', mode);
  };

  const handleAudioEnded = () => {
    if (!audioRef.current || !currentSurah) return;

    // Check repeat mode
    if (repeatMode === 'surah') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    // Check sleep timer 'end_of_surah'
    if (sleepTimerMinutes === -1) {
      setSleepTimer(null);
      pause();
      return;
    }

    // Auto advance to next surah if setting is enabled
    if (settings.autoPlayNext && currentSurah.id < 114) {
      window.dispatchEvent(new CustomEvent('quran:next-surah'));
    } else {
      pause();
    }
  };

  const nextSurah = (surahs: Surah[]) => {
    if (!currentSurah) return;
    const currentIndex = surahs.findIndex(s => s.id === currentSurah.id);
    if (currentIndex >= 0 && currentIndex < surahs.length - 1) {
      playSurah(surahs[currentIndex + 1]);
    } else if (repeatMode === 'all' && surahs.length > 0) {
      playSurah(surahs[0]);
    }
  };

  const prevSurah = (surahs: Surah[]) => {
    if (!currentSurah) return;
    const currentIndex = surahs.findIndex(s => s.id === currentSurah.id);
    if (currentIndex > 0) {
      playSurah(surahs[currentIndex - 1]);
    }
  };

  // Sleep timer interval
  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutesState(minutes);
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }

    if (!minutes || minutes <= 0) {
      setSleepRemainingSeconds(null);
      return;
    }

    // End of surah special code -1
    if (minutes === -1) {
      setSleepRemainingSeconds(null);
      return;
    }

    const totalSeconds = minutes * 60;
    setSleepRemainingSeconds(totalSeconds);

    let remaining = totalSeconds;
    sleepIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setSleepRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(sleepIntervalRef.current);
        sleepIntervalRef.current = null;
        setSleepTimerMinutesState(null);
        setSleepRemainingSeconds(null);
        pause();
      }
    }, 1000);
  };

  return (
    <AudioContext.Provider
      value={{
        currentSurah,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        buffered,
        playbackSpeed,
        repeatMode,
        currentAyahNumber,
        activeTimings,
        isFullPlayerOpen,
        sleepTimerMinutes,
        sleepRemainingSeconds,
        errorMessage,
        playSurah,
        togglePlay,
        pause,
        resume,
        seek,
        seekRelative,
        nextSurah,
        prevSurah,
        setSpeed,
        setRepeat,
        openFullPlayer: () => setIsFullPlayerOpen(true),
        closeFullPlayer: () => setIsFullPlayerOpen(false),
        setSleepTimer,
        clearError: () => setErrorMessage(null)
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
