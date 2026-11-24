/**
 * Application Configuration
 * Easy to rename, re-point audio bucket, or adjust app parameters.
 */

export const APP_CONFIG = {
  // App branding (easy to rename)
  appName: "Quran Malayalam Audio",
  appNameMalayalam: "ഖുർആൻ മലയാളം ഓഡിയോ",
  shortName: "Quran Audio",
  description: "Quran Audio with Malayalam Translation - Offline-first PWA Player and Reader",
  version: "1.0.0",

  // Audio host: Cloudflare R2 bucket public URL
  // Default to public R2 URL or fallback relative URL
  audioBaseUrl: import.meta.env.VITE_AUDIO_BASE_URL || "https://pub-7f6c49ed54814628850faf876959bcd2.r2.dev",

  // Fallback demo/local audio folder if testing locally
  localAudioFallbackUrl: "/malayalam quran mp3",

  // Cache names
  cacheNames: {
    audio: "quran-audio-v1",
    data: "quran-data-v1",
    static: "quran-static-v1"
  },

  // Storage Keys
  dbName: "QuranMalayalamAudioDB",
  dbVersion: 2,

  // Audio settings defaults
  defaultPlaybackSpeed: 1.0,
  defaultSeekSeconds: 15,

  // Default font sizes (px)
  defaultArabicFontSize: 28,
  defaultMalayalamFontSize: 17,

  // Credits & Developer Contact
  credits: {
    reciter: "Mishary Rashid Alafasy / Sheikh Abdul Basit (Arabic)",
    malayalamTranslation: "Cheriyamundam Abdul Hameed Madani & Kunhi Mohammed Parappoor",
    malayalamVoice: "Al-Quran Malayalam Audio Project",
    developer: "Adhil Ansari",
    developerUrl: "https://adhilansari.vercel.app/",
    coffeeUrl: "https://buymeacoffee.com/adhilansari"
  }
};
