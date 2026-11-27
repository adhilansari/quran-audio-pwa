import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  Volume2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Share2,
  ChevronsDown,
  X,
  Sliders,
  ArrowUp,
  ArrowDown,
  Sun,
  Moon,
  Sparkles,
  Search
} from 'lucide-react';
import { Surah, Ayah, ThemeMode } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudio } from '@/contexts/AudioContext';
import { isBookmarked, addBookmark, removeBookmark, saveReadingHistory } from '@/services/db';
import { loadSurahAyahs } from '@/services/translationService';
import { AyahShareModal } from '@/components/AyahShareModal';
import surahsData from '@/data/surahs.json';

interface ReaderViewProps {
  surah: Surah;
  initialAyahNumber?: number;
  onBack: () => void;
  onSelectSurah?: (surah: Surah) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  surah,
  initialAyahNumber,
  onBack,
  onSelectSurah
}) => {
  const { settings, updateSetting, t } = useSettings();
  const {
    currentSurah,
    isPlaying,
    isLoading: isChapterAudioLoading,
    playSurah,
    togglePlay
  } = useAudio();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<number, boolean>>({});
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [shareTargetAyah, setShareTargetAyah] = useState<Ayah | null>(null);
  const [jumpedAyah, setJumpedAyah] = useState<number | null>(null);

  // Progressive Lazy Loading for large chapters (e.g. Al-Baqarah 286 ayahs)
  const [visibleCount, setVisibleCount] = useState(initialAyahNumber ? Math.max(35, initialAyahNumber + 10) : 35);

  // Auto-scroll states & speed controls (0.1x to 3.0x)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<number>(1.0);
  const animationFrameRef = useRef<number | null>(null);

  // Assistive Ball (Floating quick controls with 3-sec auto-fade)
  const [isAssistiveOpen, setIsAssistiveOpen] = useState(false);
  const [isFaded, setIsFaded] = useState(false);
  const [isBlinking, setIsBlinking] = useState(true);
  const [jumpInputAyah, setJumpInputAyah] = useState('');
  const fadeTimeoutRef = useRef<any>(null);
  const openTimestampRef = useRef<number>(0);

  // Draggable Assistive Ball position state (persisted across views & refresh in localStorage)
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('quran_assistive_ball_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const safeX = Math.max(10, Math.min(window.innerWidth - 60, parsed.x));
          const safeY = Math.max(70, Math.min(window.innerHeight - 80, parsed.y));
          return { x: safeX, y: safeY };
        }
      }
    } catch {}
    return null;
  });

  const saveBallPos = (pos: { x: number; y: number }) => {
    setBallPos(pos);
    try {
      localStorage.setItem('quran_assistive_ball_pos', JSON.stringify(pos));
    } catch {}
  };

  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasDragged: boolean;
  } | null>(null);
  const ballElemRef = useRef<HTMLDivElement>(null);

  const handleBallTouchStart = (e: React.TouchEvent) => {
    resetFadeTimer();
    const touch = e.touches[0];
    const rect = ballElemRef.current?.getBoundingClientRect();
    if (rect) {
      dragInfoRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        origX: rect.left,
        origY: rect.top,
        hasDragged: false
      };
    }
  };

  const handleBallTouchMove = (e: React.TouchEvent) => {
    if (!dragInfoRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragInfoRef.current.startX;
    const deltaY = touch.clientY - dragInfoRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      dragInfoRef.current.hasDragged = true;
    }

    if (dragInfoRef.current.hasDragged) {
      const newX = Math.max(10, Math.min(window.innerWidth - 58, dragInfoRef.current.origX + deltaX));
      const newY = Math.max(70, Math.min(window.innerHeight - 80, dragInfoRef.current.origY + deltaY));
      setBallPos({ x: newX, y: newY });
    }
  };

  const handleBallTouchEnd = (e: React.TouchEvent) => {
    if (dragInfoRef.current) {
      if (!dragInfoRef.current.hasDragged) {
        e.preventDefault(); // Stop synthetic mouse click bleed into modal sheet
        openTimestampRef.current = Date.now();
        setIsAssistiveOpen(prev => !prev);
      } else {
        const rect = ballElemRef.current?.getBoundingClientRect();
        if (rect) {
          saveBallPos({ x: rect.left, y: rect.top });
        }
      }
      dragInfoRef.current = null;
    }
  };

  const handleBallMouseDown = (e: React.MouseEvent) => {
    resetFadeTimer();
    const rect = ballElemRef.current?.getBoundingClientRect();
    if (rect) {
      dragInfoRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: rect.left,
        origY: rect.top,
        hasDragged: false
      };

      const handleMouseMove = (moveEvt: MouseEvent) => {
        if (!dragInfoRef.current) return;
        const deltaX = moveEvt.clientX - dragInfoRef.current.startX;
        const deltaY = moveEvt.clientY - dragInfoRef.current.startY;
        if (Math.hypot(deltaX, deltaY) > 5) {
          dragInfoRef.current.hasDragged = true;
        }
        if (dragInfoRef.current.hasDragged) {
          const newX = Math.max(10, Math.min(window.innerWidth - 58, dragInfoRef.current.origX + deltaX));
          const newY = Math.max(70, Math.min(window.innerHeight - 80, dragInfoRef.current.origY + deltaY));
          setBallPos({ x: newX, y: newY });
        }
      };

      const handleMouseUp = () => {
        if (dragInfoRef.current) {
          if (!dragInfoRef.current.hasDragged) {
            openTimestampRef.current = Date.now();
            setIsAssistiveOpen(prev => !prev);
          } else {
            const rect = ballElemRef.current?.getBoundingClientRect();
            if (rect) {
              saveBallPos({ x: rect.left, y: rect.top });
            }
          }
          dragInfoRef.current = null;
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  // Ayah-level single recitation audio
  const [playingAyahNum, setPlayingAyahNum] = useState<number | null>(null);
  const ayahAudioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Assistive ball fade timer handler
  const resetFadeTimer = () => {
    setIsFaded(false);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      if (!isAssistiveOpen) {
        setIsFaded(true);
      }
    }, 3000);
  };

  useEffect(() => {
    // Initial 3-sec gentle discovery blink, then soft fade
    const blinkTimer = setTimeout(() => {
      setIsBlinking(false);
      setIsFaded(true);
    }, 3000);

    fadeTimeoutRef.current = setTimeout(() => {
      setIsFaded(true);
    }, 3000);

    return () => {
      clearTimeout(blinkTimer);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // Load Chapter Ayahs (IndexedDB -> Static -> Dynamic Open Quran CDN)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    if (initialAyahNumber) {
      setVisibleCount(Math.max(35, initialAyahNumber + 10));
    } else {
      setVisibleCount(35);
    }

    async function load() {
      try {
        const data = await loadSurahAyahs(surah.id);
        if (isMounted) {
          setAyahs(data);
        }
      } catch (err) {
        if (isMounted) setAyahs([]);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Check bookmarks
      const bMap: Record<number, boolean> = {};
      for (let i = 1; i <= Math.min(surah.ayahCount, 25); i++) {
        bMap[i] = await isBookmarked(surah.id, i);
      }
      if (isMounted) setBookmarkedMap(bMap);
    }

    load();

    return () => {
      isMounted = false;
      if (ayahAudioRef.current) {
        ayahAudioRef.current.pause();
        ayahAudioRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [surah.id, initialAyahNumber]);

  // Jump to initial ayah if passed from Reading History
  useEffect(() => {
    if (!loading && initialAyahNumber && ayahs.length > 0) {
      const timer = setTimeout(() => {
        const el = ayahRefs.current.get(initialAyahNumber);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setJumpedAyah(initialAyahNumber);
          setTimeout(() => setJumpedAyah(null), 3500);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [loading, initialAyahNumber, ayahs.length]);

  // Reading history tracking on scroll
  useEffect(() => {
    let scrollTimeout: any = null;

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Find visible ayah closest to viewport top/center
        const viewportMid = window.innerHeight * 0.35;
        let closestAyah = 1;
        let minDiff = Infinity;

        ayahRefs.current.forEach((el, ayahNum) => {
          const rect = el.getBoundingClientRect();
          const diff = Math.abs(rect.top - viewportMid);
          if (diff < minDiff) {
            minDiff = diff;
            closestAyah = ayahNum;
          }
        });

        if (closestAyah > 0) {
          saveReadingHistory({
            surahId: surah.id,
            ayahNumber: closestAyah,
            surahNameMalayalam: surah.malayalamName,
            surahNameEnglish: surah.englishName,
            surahTotalAyahs: surah.ayahCount,
            readAt: Date.now()
          });
        }
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [surah]);

  // Auto-scroll loop with subpixel accumulator & smooth frame-rate independence
  const autoScrollSpeedRef = useRef(autoScrollSpeed);
  autoScrollSpeedRef.current = autoScrollSpeed;

  const visibleCountRef = useRef(visibleCount);
  visibleCountRef.current = visibleCount;

  const ayahsLengthRef = useRef(ayahs.length);
  ayahsLengthRef.current = ayahs.length;

  useEffect(() => {
    if (!isAutoScrolling) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    let scrollAccumulator = 0;

    const scrollStep = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1); // clamp to 100ms
      lastTime = now;

      // Base speed: 40 pixels per second * speed multiplier (0.1x to 3.0x)
      const speed = autoScrollSpeedRef.current;
      scrollAccumulator += speed * 40 * delta;

      if (scrollAccumulator >= 1) {
        const pxToScroll = Math.floor(scrollAccumulator);
        window.scrollBy({ top: pxToScroll, behavior: 'auto' });
        scrollAccumulator -= pxToScroll;
      }

      // Progressively expand visibleCount as user scrolls down
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      if (docHeight - scrollBottom < 600 && visibleCountRef.current < ayahsLengthRef.current) {
        setVisibleCount(prev => Math.min(ayahsLengthRef.current, prev + 25));
      }

      // Check if reached very bottom of chapter (only if actually scrollable and at the bottom)
      const isAtBottom = docHeight - scrollBottom <= 4;
      const isFullyLoaded = visibleCountRef.current >= ayahsLengthRef.current;
      const hasScrolled = window.scrollY > 50;

      if (isAtBottom && isFullyLoaded && hasScrolled) {
        setIsAutoScrolling(false);
        if (settings.autoPlayNext && surah.id < 114) {
          const allSurahs = surahsData as Surah[];
          const next = allSurahs.find(s => s.id === surah.id + 1);
          if (next && onSelectSurah) {
            onSelectSurah(next);
            if (isCurrentSurahPlaying) {
              playSurah(next);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
        return;
      }

      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isAutoScrolling]);

  const toggleBookmark = async (ayahNum: number) => {
    const isSaved = bookmarkedMap[ayahNum];
    const id = `ayah-${surah.id}-${ayahNum}`;

    if (isSaved) {
      await removeBookmark(id);
      setBookmarkedMap(prev => ({ ...prev, [ayahNum]: false }));
    } else {
      await addBookmark({
        id,
        surahId: surah.id,
        ayahNumber: ayahNum,
        createdAt: Date.now()
      });
      setBookmarkedMap(prev => ({ ...prev, [ayahNum]: true }));
    }
  };

  // Play individual Ayah audio recitation with instant offline caching
  const handlePlaySingleAyah = async (ayah: Ayah) => {
    if (playingAyahNum === ayah.ayah) {
      if (ayahAudioRef.current) {
        ayahAudioRef.current.pause();
      }
      setPlayingAyahNum(null);
      return;
    }

    if (ayahAudioRef.current) {
      ayahAudioRef.current.pause();
    }

    const surahPadded = String(surah.number || surah.id).padStart(3, '0');
    const ayahPadded = String(ayah.ayah).padStart(3, '0');
    const primaryUrl = `https://everyayah.com/data/Alafasy_128kbps/${surahPadded}${ayahPadded}.mp3`;
    const fallbackUrl = ayah.globalAyahNumber
      ? `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.globalAyahNumber}.mp3`
      : null;

    // Check CacheStorage for instant offline audio blob
    let playUrl = primaryUrl;
    try {
      if (typeof caches !== 'undefined') {
        const audioCache = await caches.open('quran-audio-v1');
        const matched = (await audioCache.match(primaryUrl)) || (fallbackUrl ? await audioCache.match(fallbackUrl) : null);
        if (matched) {
          const blob = await matched.blob();
          playUrl = URL.createObjectURL(blob);
        } else {
          // Auto-cache in background so once heard, it NEVER needs to fetch again
          fetch(primaryUrl)
            .then(res => {
              if (res.ok) audioCache.put(primaryUrl, res);
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      // Fallback to streaming directly
    }

    const audio = new Audio(playUrl);
    ayahAudioRef.current = audio;
    setPlayingAyahNum(ayah.ayah);

    audio.play().catch(e => {
      console.warn('Single ayah audio play error:', e);
      if (fallbackUrl) {
        const fbAudio = new Audio(fallbackUrl);
        ayahAudioRef.current = fbAudio;
        fbAudio.play().catch(() => setPlayingAyahNum(null));
        fbAudio.onended = () => setPlayingAyahNum(null);
        fbAudio.onerror = () => setPlayingAyahNum(null);
      } else {
        setPlayingAyahNum(null);
      }
    });

    audio.onended = () => {
      setPlayingAyahNum(null);
    };
    audio.onerror = () => {
      setPlayingAyahNum(null);
    };
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    setVisibleCount(ayahs.length);
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 150);
  };

  const handleJumpToSpecificAyah = (targetNum?: number) => {
    const num = targetNum || parseInt(jumpInputAyah, 10);
    if (!num || num < 1 || num > surah.ayahCount) return;
    if (num > visibleCount) {
      setVisibleCount(Math.min(ayahs.length, num + 10));
    }
    setTimeout(() => {
      const el = ayahRefs.current.get(num);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setJumpedAyah(num);
        setTimeout(() => setJumpedAyah(null), 3500);
      }
    }, 200);
    setIsAssistiveOpen(false);
  };

  const handleCopyAyah = (ayah: Ayah) => {
    const textToCopy = `${ayah.arabic}\n\n${ayah.malayalam}\n\n[ഖുർആൻ ${surah.number}:${ayah.ayah}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAyah(ayah.ayah);
    setTimeout(() => {
      setCopiedAyah(null);
    }, 2000);
  };

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      // Detect swipe-from-left edge (within 35px from screen left)
      if (touch.clientX <= 35) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    touchStartRef.current = null;

    // Significant rightward swipe from edge
    if (deltaX > 65 && deltaY < 55) {
      if ('vibrate' in navigator) navigator.vibrate(10);
      onBack();
    }
  };

  const handleBackWithHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(8);
    onBack();
  };

  const isCurrentSurahPlaying = currentSurah?.id === surah.id && isPlaying;
  const isCurrentSurahLoading = currentSurah?.id === surah.id && isChapterAudioLoading;

  const visibleAyahs = ayahs.slice(0, visibleCount);
  const hasMore = visibleCount < ayahs.length;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-[#faf8f5] dark:bg-[#0b1411] bg-islamic-stars text-stone-900 dark:text-stone-100 pb-36 animate-in fade-in duration-200"
    >
      {/* Sticky Reader Navigation Bar */}
      <div className="sticky top-0 z-20 bg-[#faf8f5]/95 dark:bg-[#0b1411]/95 backdrop-blur-md border-b border-stone-200 dark:border-emerald-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackWithHaptic}
            className="p-1.5 -ml-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-emerald-950 transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
              {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {surah.englishName} • {surah.ayahCount} {t('ayahCount')}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Auto-Scroll Toggle */}
          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(8);
              setIsAutoScrolling(prev => {
                const nextState = !prev;
                if (nextState) {
                  const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
                  const scrollBottom = window.innerHeight + window.scrollY;
                  if (docHeight - scrollBottom <= 10 && window.scrollY > 100) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }
                return nextState;
              });
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isAutoScrolling
              ? 'bg-amber-400 text-emerald-950 border-amber-300 font-bold shadow-xs'
              : 'border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-emerald-950'
              }`}
            title="Auto-Scroll"
          >
            <ChevronsDown className={`w-3.5 h-3.5 ${isAutoScrolling ? 'animate-bounce text-emerald-950' : 'text-amber-500'}`} />
            <span className="hidden sm:inline">Auto-Scroll</span>
            <span className="text-[10px] opacity-80">{autoScrollSpeed}x</span>
          </button>

          {/* Chapter Audio Play / Pause Button */}
          <button
            onClick={() => {
              setIsAutoScrolling(false);
              if (isCurrentSurahPlaying) {
                togglePlay();
              } else {
                playSurah(surah);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-xs shadow-sm transition-all"
            title="Listen to full chapter recitation"
          >
            {isCurrentSurahLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : isCurrentSurahPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('listenAudio')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chapter Title Card */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-3">
        <div className="bg-gradient-to-tr from-emerald-900 to-emerald-800 rounded-3xl p-6 text-center text-white shadow-md relative overflow-hidden border border-amber-400/20">
          <div className="absolute top-3 right-4 text-[10px] tracking-widest font-bold uppercase text-amber-300">
            {surah.revelationType === 'Meccan' ? 'മക്കീ' : 'മദനീ'}
          </div>
          <h1 className="font-arabic text-4xl sm:text-5xl text-amber-300 mb-2">
            {surah.nameArabic}
          </h1>
          <h2 className="text-lg font-bold">
            {settings.language === 'ml' ? surah.malayalamName : surah.englishName}
          </h2>
          <p className="text-xs text-emerald-200 italic mt-0.5">
            "{settings.language === 'ml' ? surah.malayalamMeaning : surah.englishMeaning}"
          </p>

          {/* Bismillah Header (except Surah 9 At-Tawbah) */}
          {surah.id !== 9 && (
            <div className="mt-5 pt-4 border-t border-emerald-700/60">
              <p className="font-arabic text-2xl sm:text-3xl text-amber-200">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="font-malayalam text-xs text-emerald-100/90 mt-1">
                പരമകാരുണികനും കരുണാനിധിയുമായ അല്ലാഹുവിന്റെ നാമത്തിൽ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ayahs List Container */}
      <div className="max-w-2xl mx-auto px-4 space-y-3 mt-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white dark:bg-[#12201c] rounded-2xl p-4 border border-stone-200 dark:border-emerald-950 animate-pulse">
                <div className="h-4 bg-stone-200 dark:bg-emerald-950 rounded w-16 mb-4" />
                <div className="h-6 bg-stone-200 dark:bg-emerald-950 rounded w-full mb-3" />
                <div className="h-4 bg-stone-200 dark:bg-emerald-950 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : ayahs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#12201c] rounded-2xl border border-stone-200 dark:border-emerald-950 p-6">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-2">
              Translation text could not be loaded while offline.
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Connect to the internet once to cache all verses of Surah {surah.number} permanently.
            </p>
            <button
              onClick={() => playSurah(surah)}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-amber-300 font-bold text-xs"
            >
              Play Surah Audio
            </button>
          </div>
        ) : (
          <>
            {visibleAyahs.map((ayah) => {
              const isSaved = bookmarkedMap[ayah.ayah];
              const isPlayingThisAyah = playingAyahNum === ayah.ayah;
              const isCopied = copiedAyah === ayah.ayah;

              return (
                <div
                  key={ayah.ayah}
                  ref={(el) => {
                    if (el) ayahRefs.current.set(ayah.ayah, el);
                    else ayahRefs.current.delete(ayah.ayah);
                  }}
                  className={`ayah-card rounded-2xl p-4 transition-all duration-300 border ${isPlayingThisAyah
                    ? 'bg-amber-50 dark:bg-emerald-950/80 border-amber-400 dark:border-amber-400/80 shadow-md ring-2 ring-amber-400/20'
                    : jumpedAyah === ayah.ayah
                      ? 'bg-amber-50/70 dark:bg-emerald-950/90 border-amber-500 ring-4 ring-amber-400/40 shadow-xl scale-[1.01]'
                      : 'bg-white dark:bg-[#12201c] border-stone-200 dark:border-emerald-950/70 hover:border-emerald-300 dark:hover:border-emerald-900'
                    }`}
                >
                  {/* Ayah Header Row */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-emerald-950">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${isPlayingThisAyah || jumpedAyah === ayah.ayah
                        ? 'bg-amber-400 text-emerald-950 font-black'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300'
                        }`}>
                        {ayah.ayah}
                      </span>
                      {jumpedAyah === ayah.ayah && (
                        <span className="text-[10px] font-bold tracking-wider text-amber-500 animate-pulse">
                          {settings.language === 'ml' ? 'വായിച്ച ഭാഗം' : 'Resumed'}
                        </span>
                      )}
                    </div>

                    {/* Actions: Play Ayah, Share Image, Copy, Bookmark */}
                    <div className="flex items-center gap-1">
                      {/* Play Single Ayah Recitation */}
                      <button
                        onClick={() => handlePlaySingleAyah(ayah)}
                        className={`p-1.5 rounded-lg transition-colors ${isPlayingThisAyah
                          ? 'text-amber-500 bg-amber-50 dark:bg-emerald-950'
                          : 'text-stone-400 hover:text-emerald-700 dark:hover:text-amber-300'
                          }`}
                        title={isPlayingThisAyah ? 'Stop Ayah Recitation' : 'Listen to this Ayah'}
                      >
                        {isPlayingThisAyah ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Share Ayah (Image or Text) */}
                      <button
                        onClick={() => setShareTargetAyah(ayah)}
                        className="p-1.5 text-stone-400 hover:text-emerald-700 dark:hover:text-amber-400 rounded-lg transition-colors"
                        title="Share Ayah Image or Text"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Ayah */}
                      <button
                        onClick={() => handleCopyAyah(ayah)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
                        title="Copy Ayah text"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Bookmark Ayah */}
                      <button
                        onClick={() => toggleBookmark(ayah.ayah)}
                        className="p-1.5 text-stone-400 hover:text-amber-500 rounded-lg transition-colors"
                        title={isSaved ? 'Remove Bookmark' : 'Bookmark Ayah'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Arabic Scripture */}
                  {settings.showArabic && (
                    <div
                      className="font-arabic text-stone-900 dark:text-stone-50 leading-relaxed py-1"
                      style={{ fontSize: `${settings.arabicFontSize}px` }}
                    >
                      {ayah.arabic}
                      <span className="inline-block mx-1.5 text-amber-600 dark:text-amber-400 text-sm font-bold">
                        ﴿{ayah.ayah}﴾
                      </span>
                    </div>
                  )}

                  {/* Malayalam Translation */}
                  {settings.showMalayalam && (
                    <div
                      className="font-malayalam text-stone-700 dark:text-stone-300 leading-normal pt-2 border-t border-stone-100 dark:border-emerald-950/60"
                      style={{ fontSize: `${settings.malayalamFontSize}px` }}
                    >
                      {ayah.malayalam}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More Ayahs Button (Progressive Lazy Loading) */}
            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 35)}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#12201c] border border-stone-200 dark:border-emerald-900 text-xs font-bold text-emerald-800 dark:text-amber-300 shadow-sm hover:bg-stone-50 dark:hover:bg-emerald-950 transition-all flex items-center gap-1.5 mx-auto"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>കൂടുതൽ ആയത്തുകൾ കാണുക ({visibleCount} of {ayahs.length})</span>
                </button>
              </div>
            )}

            {/* Next Chapter Navigation Card (When chapter ends) */}
            {!hasMore && surah.id < 114 && (
              <div className="pt-8 pb-14 text-center">
                <button
                  onClick={() => {
                    const allSurahs = surahsData as Surah[];
                    const next = allSurahs.find(s => s.id === surah.id + 1);
                    if (next) {
                      if (onSelectSurah) {
                        onSelectSurah(next);
                      }
                      if (isCurrentSurahPlaying) {
                        playSurah(next);
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold text-sm shadow-xl border border-amber-400/50 transition-all active:scale-95"
                >
                  <span>
                    {settings.language === 'ml'
                      ? `അടുത്ത സൂറത്ത് വായിക്കുക (${(surahsData as Surah[])[surah.id]?.malayalamName || ''})`
                      : `Next Chapter (${(surahsData as Surah[])[surah.id]?.englishName || ''})`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Side Tiny Scroll Speed Controller (Visible when Auto-Scroll is Active) */}
      {isAutoScrolling && (
        <div className="fixed right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-40 bg-emerald-950/90 text-white backdrop-blur-md rounded-2xl py-2 px-1 border border-amber-400/50 shadow-2xl flex flex-col items-center gap-1.5 animate-in slide-in-from-right-3 duration-200">
          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(8);
              setAutoScrollSpeed(prev => +(Math.min(3.0, prev < 0.5 ? prev + 0.1 : prev + 0.25)).toFixed(2));
            }}
            className="w-6 h-6 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 flex items-center justify-center font-black text-xs transition-colors active:scale-95"
            title="Speed up scroll"
          >
            +
          </button>

          <span className="text-[10px] font-black text-amber-300 py-0.5 tracking-tighter">
            {autoScrollSpeed.toFixed(1)}x
          </span>

          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(8);
              setAutoScrollSpeed(prev => +(Math.max(0.1, prev <= 0.5 ? prev - 0.1 : prev - 0.25)).toFixed(2));
            }}
            className="w-6 h-6 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 flex items-center justify-center font-black text-xs transition-colors active:scale-95"
            title="Slow down scroll"
          >
            -
          </button>

          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className="mt-0.5 w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-xs hover:bg-amber-300 transition-colors"
            title={isAutoScrolling ? 'Pause' : 'Resume'}
          >
            {isAutoScrolling ? (
              <Pause className="w-2.5 h-2.5 fill-current" />
            ) : (
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setIsAutoScrolling(false)}
            className="mt-0.5 p-1 text-emerald-300 hover:text-white rounded-lg transition-colors"
            title="Close auto-scroll"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Draggable Assistive Ball (Positioned above minimized player & freely draggable) */}
      <div
        ref={ballElemRef}
        onTouchStart={handleBallTouchStart}
        onTouchMove={handleBallTouchMove}
        onTouchEnd={handleBallTouchEnd}
        onMouseDown={handleBallMouseDown}
        onMouseEnter={resetFadeTimer}
        style={
          ballPos
            ? { left: `${ballPos.x}px`, top: `${ballPos.y}px`, right: 'auto', bottom: 'auto' }
            : currentSurah
              ? { bottom: '80px' }
              : { bottom: '24px' }
        }
        className={`fixed right-3 sm:right-5 z-40 select-none transition-opacity duration-300 touch-none cursor-grab active:cursor-grabbing ${isFaded ? 'opacity-35 hover:opacity-100 scale-90' : 'opacity-100 scale-100'
          }`}
      >
        <button
          type="button"
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-transform ${isBlinking ? 'animate-pulse ring-4 ring-amber-400/60' : ''
            } ${isAssistiveOpen
              ? 'bg-amber-400 text-emerald-950 rotate-90 scale-105'
              : 'bg-emerald-800 text-amber-300 border-2 border-amber-400/80 hover:scale-105'
            }`}
          title="Reading Assistant Settings (Drag to move)"
        >
          {isAssistiveOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Sliders className="w-5 h-5 text-amber-300" />
          )}
        </button>
      </div>

      {/* Assistive Ball Reading Quick Settings Sheet */}
      {isAssistiveOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAssistiveOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#12201c] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-emerald-950 shadow-2xl overflow-hidden p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-emerald-950">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {settings.language === 'ml' ? 'വായനാ ക്രമീകരണങ്ങൾ' : 'Reading Assistant'}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {surah.malayalamName} • {surah.englishName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssistiveOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Auto-Scroll Control */}
            <div className="bg-stone-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-stone-200 dark:border-emerald-900 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                <span className="flex items-center gap-1.5">
                  <ChevronsDown className="w-4 h-4 text-amber-500" />
                  <span>{settings.language === 'ml' ? 'ഓട്ടോ സ്ക്രോൾ' : 'Auto-Scroll'}</span>
                </span>
                <button
                  onClick={() => {
                    if (Date.now() - openTimestampRef.current < 250) return;
                    if ('vibrate' in navigator) navigator.vibrate(8);
                    setIsAutoScrolling(prev => {
                      const next = !prev;
                      if (next) {
                        setIsAssistiveOpen(false); // Close sheet so user can view scrolling text immediately!
                      }
                      return next;
                    });
                  }}
                  className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${isAutoScrolling
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'bg-emerald-800 text-amber-300'
                    }`}
                >
                  {isAutoScrolling ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{isAutoScrolling ? 'Pause' : 'Start'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-stone-500 dark:text-stone-400 font-medium">
                  {settings.language === 'ml' ? 'വേഗത:' : 'Speed:'}
                </span>
                <div className="flex items-center gap-1">
                  {[0.1, 0.2, 0.5, 1.0, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        if (Date.now() - openTimestampRef.current < 250) return;
                        if ('vibrate' in navigator) navigator.vibrate(8);
                        setAutoScrollSpeed(spd);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-bold text-xs transition-all active:scale-95 ${autoScrollSpeed === spd
                        ? 'bg-emerald-800 text-amber-300 shadow-xs'
                        : 'bg-white dark:bg-emerald-950 border border-stone-200 dark:border-emerald-800 text-stone-700 dark:text-stone-300'
                        }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Instant Theme Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{settings.language === 'ml' ? 'തീം (Themes)' : 'Theme'}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'light', label: settings.language === 'ml' ? 'ലൈറ്റ്' : 'Light', icon: '☀️' },
                  { id: 'dark', label: settings.language === 'ml' ? 'മരതകം' : 'Emerald', icon: '🌙' },
                  { id: 'sepia', label: settings.language === 'ml' ? 'നൈറ്റ് ഐ' : 'Night Eye', icon: '👁️' },
                  { id: 'midnight', label: 'AMOLED', icon: '🖤' },
                  { id: 'sapphire', label: 'Sapphire', icon: '🌌' },
                  { id: 'glassDark', label: settings.language === 'ml' ? 'ഗ്ലാസ്' : 'Glass', icon: '💎' },
                  { id: 'system', label: settings.language === 'ml' ? 'സിസ്റ്റം' : 'Auto', icon: '⚙️' }
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      if (Date.now() - openTimestampRef.current < 250) return;
                      if ('vibrate' in navigator) navigator.vibrate(8);
                      updateSetting('theme', th.id as ThemeMode);
                    }}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 border transition-all active:scale-95 ${settings.theme === th.id
                      ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-xs scale-102 font-extrabold'
                      : 'bg-stone-50 dark:bg-emerald-950/40 border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                  >
                    <span className="text-sm">{th.icon}</span>
                    <span className="truncate max-w-[65px]">{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Typography Adjustments (Discrete Named Sizes + Live Preview) */}
            <div className="space-y-3 pt-1">
              {/* Arabic Font Options */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    {settings.language === 'ml' ? 'അറബിക് ഫോണ്ട്' : 'Arabic Font'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {settings.arabicFontSize}px
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 w-full">
                  {[
                    { label: settings.language === 'ml' ? 'ചെറുത്' : 'Small', val: 24 },
                    { label: settings.language === 'ml' ? 'സാധാരണ' : 'Normal', val: 28 },
                    { label: settings.language === 'ml' ? 'ഇടത്തരം' : 'Medium', val: 32 },
                    { label: settings.language === 'ml' ? 'വലുത്' : 'Large', val: 36 },
                    { label: settings.language === 'ml' ? 'കൂടുതൽ' : 'Huge', val: 42 }
                  ].map((size) => (
                    <button
                      key={size.val}
                      onClick={() => {
                        if (Date.now() - openTimestampRef.current < 250) return;
                        if ('vibrate' in navigator) navigator.vibrate(8);
                        updateSetting('arabicFontSize', size.val);
                      }}
                      className={`min-w-0 w-full py-1.5 px-0.5 rounded-lg text-center border font-bold text-[10px] truncate transition-all active:scale-95 ${settings.arabicFontSize === size.val
                        ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-xs'
                        : 'bg-stone-50 dark:bg-emerald-950/40 border-stone-200 dark:border-emerald-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                        }`}
                      title={size.label}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Malayalam Font Options */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    {settings.language === 'ml' ? 'മലയാളം ഫോണ്ട്' : 'Malayalam Font'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {settings.malayalamFontSize}px
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 w-full">
                  {[
                    { label: settings.language === 'ml' ? 'ചെറുത്' : 'Small', val: 14 },
                    { label: settings.language === 'ml' ? 'സാധാരണ' : 'Normal', val: 16 },
                    { label: settings.language === 'ml' ? 'ഇടത്തരം' : 'Medium', val: 18 },
                    { label: settings.language === 'ml' ? 'വലുത്' : 'Large', val: 20 },
                    { label: settings.language === 'ml' ? 'കൂടുതൽ' : 'Huge', val: 22 }
                  ].map((size) => (
                    <button
                      key={size.val}
                      onClick={() => {
                        if (Date.now() - openTimestampRef.current < 250) return;
                        if ('vibrate' in navigator) navigator.vibrate(8);
                        updateSetting('malayalamFontSize', size.val);
                      }}
                      className={`min-w-0 w-full py-1.5 px-0.5 rounded-lg text-center border font-bold text-[10px] truncate transition-all active:scale-95 ${settings.malayalamFontSize === size.val
                        ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-xs'
                        : 'bg-stone-50 dark:bg-emerald-950/40 border-stone-200 dark:border-emerald-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                        }`}
                      title={size.label}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Typography Preview Card */}
              <div className="p-3 rounded-2xl bg-stone-100 dark:bg-emerald-950/60 border border-stone-200 dark:border-emerald-900/80 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{settings.language === 'ml' ? 'തത്സമയ പ്രിവ്യൂ' : 'Live Preview'}</span>
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                    Arabic {settings.arabicFontSize}px • ML {settings.malayalamFontSize}px
                  </span>
                </div>
                {settings.showArabic && (
                  <p
                    className="font-arabic text-stone-900 dark:text-stone-100 text-right leading-relaxed"
                    style={{ fontSize: `${settings.arabicFontSize}px` }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                )}
                {settings.showMalayalam && (
                  <p
                    className="text-stone-700 dark:text-stone-300 font-malayalam leading-normal"
                    style={{ fontSize: `${settings.malayalamFontSize}px` }}
                  >
                    പരമകാരുണികനും കരുണാനിധിയുമായ അല്ലാഹുവിന്റെ നാമത്തിൽ.
                  </p>
                )}
              </div>
            </div>

            {/* 4. Visibility Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-emerald-950 text-xs">
              <button
                onClick={() => updateSetting('showArabic', !settings.showArabic)}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all ${settings.showArabic
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-stone-50 dark:bg-emerald-950/30 border-stone-200 dark:border-emerald-900 text-stone-400'
                  }`}
              >
                {settings.showArabic ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{settings.language === 'ml' ? 'അറബിക്' : 'Arabic'}</span>
              </button>

              <button
                onClick={() => updateSetting('showMalayalam', !settings.showMalayalam)}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all ${settings.showMalayalam
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-stone-50 dark:bg-emerald-950/30 border-stone-200 dark:border-emerald-900 text-stone-400'
                  }`}
              >
                {settings.showMalayalam ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{settings.language === 'ml' ? 'മലയാളം' : 'Malayalam'}</span>
              </button>
            </div>

            {/* 5. Navigation Jumps */}
            <div className="pt-2 border-t border-stone-100 dark:border-emerald-950 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    scrollToTop();
                    setIsAssistiveOpen(false);
                  }}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-stone-100 dark:bg-emerald-950/60 border border-stone-200 dark:border-emerald-900 text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-1 hover:bg-stone-200"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>{settings.language === 'ml' ? 'മുകളിലേക്ക്' : 'Top'}</span>
                </button>

                <button
                  onClick={() => {
                    scrollToBottom();
                    setIsAssistiveOpen(false);
                  }}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-stone-100 dark:bg-emerald-950/60 border border-stone-200 dark:border-emerald-900 text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-1 hover:bg-stone-200"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-amber-500" />
                  <span>{settings.language === 'ml' ? 'താഴേക്ക്' : 'Bottom'}</span>
                </button>
              </div>

              {/* Jump to specific Ayah */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={surah.ayahCount}
                  placeholder={`${settings.language === 'ml' ? 'ആയത്ത് # (1-' : 'Ayah # (1-'}${surah.ayahCount})`}
                  value={jumpInputAyah}
                  onChange={(e) => setJumpInputAyah(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJumpToSpecificAyah();
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-emerald-950/80 border border-stone-200 dark:border-emerald-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleJumpToSpecificAyah()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-amber-300 font-bold text-xs hover:bg-emerald-700"
                >
                  {settings.language === 'ml' ? 'പോവുക' : 'Go'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ayah Share & Export Modal */}
      {shareTargetAyah && (
        <AyahShareModal
          surah={surah}
          ayah={shareTargetAyah}
          isOpen={!!shareTargetAyah}
          onClose={() => setShareTargetAyah(null)}
        />
      )}
    </div>
  );
};
