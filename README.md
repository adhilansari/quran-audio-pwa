# 📖 Quran Malayalam Audio (ഖുർആൻ മലയാളം ഓഡിയോ)

[![Production](https://img.shields.io/badge/Live-mlquran.vercel.app-065f46?style=for-the-badge&logo=vercel)](https://mlquran.vercel.app/)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-d97706?style=for-the-badge&logo=pwa)](https://mlquran.vercel.app/)
[![React](https://img.shields.io/badge/React_19-TypeScript-0284c7?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS_v4-064e3b?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Cloudflare R2](https://img.shields.io/badge/Audio-Cloudflare_R2-f97316?style=for-the-badge&logo=cloudflare)](https://cloudflare.com/)

An aesthetic, production-grade, offline-first Progressive Web App (PWA): a complete Quran audio player paired with chapter-by-chapter and verse-by-verse Malayalam translation (*Cheriyamundam Abdul Hameed Madani & Kunhi Mohammed Parappoor*).

**Live Production Link:** [https://mlquran.vercel.app/](https://mlquran.vercel.app/)

---

## 🌟 Key Highlights & Architecture

### 1. 📖 Complete 114 Surahs Reading Experience
* **Authentic Typography:** Arabic Uthmani text rendered with the elegant *Amiri* / *Scheherazade New* fonts, paired directly with legible Malayalam script (*Noto Sans Malayalam* / *Manjari*).
* **Pre-bundled & Cached:** All 114 Surahs are bundled as static JSON data and automatically synced to IndexedDB for 100% offline access.
* **Progressive Lazy Rendering:** Large chapters (such as Surah Al-Baqarah with 286 verses) load in 0ms with buttery-smooth 60 FPS scrolling through intelligent virtualized chunking.
* **Auto-Scroll with Speed Controls:** Hands-free reading mode with customizable scroll speeds (`0.5x`, `1.0x`, `1.5x`, `2.0x`, `3.0x`), floating controls, and seamless continuous virtual chunk loading.
* **Ayah Social Sharing & Card Image Generator:**
  - Generates high-resolution, ornate Islamic image cards (1080px) on-the-fly with Arabic Uthmani text, Malayalam translation, and reference citation.
  - Native Web Share API integration: shares directly to **WhatsApp, Instagram Stories, Telegram, Facebook**, etc.
  - One-tap clipboard copy for both the generated card image and formatted text.
* **Recent Reading History (Last 10 Surahs & Exact Ayah):**
  - Automatically records your reading position as you scroll.
  - Displays your last 10 read Surahs on the Home page with progress bars and exact verse numbers.
  - One-tap resume instantly opens the chapter and jumps directly to that verse with a highlight ring.
* **Reading Customization:**
  - Independent font size sliders for both Arabic and Malayalam.
  - Toggles to show/hide Arabic text or Malayalam translation.
  - One-tap copy for verses with citation (e.g. `[ഖുർആൻ 2:255]`).
  - Ayah-level bookmarking.

---

### 2. 🎧 Dual Audio System (Chapter-Level & Ayah-Level)
* **Chapter Audio Recitation (Cloudflare R2):**
  - High-fidelity continuous recitation for all 114 Surahs.
  - Hosted on **Cloudflare R2** with zero egress fees and global CDN edge routing.
  - Full **Media Session API** support: lock-screen controls, notification bar artwork, Bluetooth play/pause/seek controls.
  - Controls: Play/Pause, ±15s fast scrub, repeat (off / surah / all), sleep timer (15m, 30m, 45m, 60m, end of surah), playback speed (0.75x–2.0x), and auto-resume where you left off.
* **Ayah-by-Ayah Audio Recitation:**
  - Every verse in the reader view includes an individual speaker button to listen to that specific verse's recitation on demand.

---

### 3. ⚡ Offline Downloads & HTTP Range Requests
* **True Offline Caching:** Download single Surahs, selections, or the entire Quran (~1.31 GB) with real-time percentage progress bars (`0%–100%`).
* **Service Worker HTTP Range Request Slicing (`206 Partial Content`):**
  - **The iOS Safari Problem:** On iOS/Safari, `<audio>` elements fail or refuse to seek cached media if the service worker responds with a regular `200 OK`.
  - **Our Solution:** A custom Workbox service worker in `src/sw.ts` parses incoming byte range headers (`Range: bytes=start-end`), slices the cached ArrayBuffer in memory, and returns an HTTP `206 Partial Content` with `Accept-Ranges: bytes` and `Content-Range`. Seeking works offline across iOS, Android, and Desktop.
* **Storage Manager:** Inspect storage usage vs available quota via `navigator.storage.estimate()` and request persistent storage via `navigator.storage.persist()`.

---

### 4. 🎨 5 Useful Themes & Visual Design
* **Warm Ivory Light Mode:** Off-white parchment aesthetic (`#faf8f5`), soothing for daytime reading with zero eye fatigue.
* **Deep Emerald Dark Mode:** Elegant Islamic emerald and charcoal palette (`#0b1411` and `#12201c`) accented with warm amber golds (`#f59e0b`).
* **Sepia Reading Oasis:** Calming, nostalgic book-paper tone (`#f7f2e7` with `#3b2a1a` typography) engineered specifically for long recitation sessions.
* **Midnight AMOLED Pure Black:** True `#000000` pitch black for maximum OLED battery savings and nighttime reading in low light.
* **System Automatic:** Dynamically synchronizes with your OS-level dark/light preference.
* **Tailwind CSS v4 Integration:** Fully hardware-accelerated theme variants with instant zero-flicker transitions.

---

### 5. 🌐 Low-Network & Spotty Connectivity Resilience
* **Zero Waiting for Scripture:** All 114 Surahs' Arabic and Malayalam texts are pre-bundled and automatically mirrored into **IndexedDB**, guaranteeing instantaneous opening even on 2G connections or when completely disconnected.
* **Fast-Timeout Fallbacks:** Dynamic API fetches fail fast (6s timeout) to bundled data rather than hanging the user interface.
* **Streaming Audio Buffering:** Real-time loading indicators (`Loader2`) give immediate visual feedback during network buffering on slow mobile connections.
* **Cellular Data Warning:** Optional prompt to protect users from unexpectedly exhausting mobile data allowances.

---

## 📁 Repository Structure

```
quran-audio-pwa/
├── public/
│   ├── data/
│   │   ├── surahs.json                 # 114 canonical Surahs metadata
│   │   ├── translations/               # 114 complete Surah JSON files
│   │   │   ├── 1.json to 114.json      # Full Arabic Uthmani + Malayalam text
│   │   └── timings/
│   │       └── 1.json                  # Surah 1 Ayah-level timestamps
│   ├── icons/                          # PWA icons (192x192, 512x512 maskable, SVG)
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx               # 5-tab persistent bottom navigation
│   │   ├── FullPlayer.tsx              # Full-screen player modal with scrubber
│   │   ├── MiniPlayer.tsx              # Sticky persistent mini player
│   │   ├── Navbar.tsx                  # Top bar with online indicator & theme switch
│   │   └── StorageManager.tsx          # IndexedDB / Cache storage monitor
│   ├── contexts/
│   │   ├── AudioContext.tsx            # HTML5 Audio, Media Session, Sleep Timer
│   │   └── SettingsContext.tsx         # Theme, UI strings, font sizes
│   ├── services/
│   │   ├── db.ts                       # IndexedDB schemas (settings, bookmarks, downloads)
│   │   ├── downloader.ts               # Streaming fetch download manager
│   │   ├── storage.ts                  # Storage persistence & quota manager
│   │   └── translationService.ts       # Scripture and translation loader
│   ├── views/                          # Code-split lazy loaded views
│   │   ├── HomeView.tsx                # Daily Ayah, continue listening, quick access
│   │   ├── SurahListView.tsx           # Search & filter tabs (All, Downloaded, Saved)
│   │   ├── ReaderView.tsx              # Ayah-by-ayah reading & audio sync
│   │   ├── DownloadsView.tsx           # Offline manager & batch download
│   │   ├── BookmarksView.tsx           # Bookmarked Ayahs and Surahs
│   │   └── SettingsView.tsx            # Theme, language, fonts, credits
│   ├── sw.ts                           # Workbox Service Worker with Range slicer
│   ├── App.tsx                         # Main app layout with Suspense lazy loading
│   └── config.ts                       # App configuration & audio base URL
├── scripts/
│   ├── build-manifest.js               # Scans audio directory & creates surahs.json
│   ├── build-translation.js            # Raw translation text parser
│   └── download-all-translations.js    # Batch generator for all 114 Surahs
├── r2-cors.json                        # Cloudflare R2 CORS configuration
├── vercel.json                         # Vercel SPA routing and cache headers
├── vite.config.ts                      # Vite + Tailwind + VitePWA config
└── package.json
```

---

## 🚀 Quick Start (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adhilansari/quran-audio-pwa.git
   cd quran-audio-pwa
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local dev server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

4. **Production Build:**
   ```bash
   npm run build
   ```

---

## ☁️ Deployment

### 1. Cloudflare R2 Audio Setup
1. Create a bucket named `quran-audio-malayalam`.
2. In bucket **Settings** > **CORS Policy**, paste the contents of `r2-cors.json`.
3. Enable public access and set the public URL in your app's `VITE_AUDIO_BASE_URL`.

### 2. Vercel Deployment
1. Connect your repository to [Vercel](https://vercel.com).
2. Set Environment Variable:
   - `VITE_AUDIO_BASE_URL`: `https://pub-your-id.r2.dev` (or your custom domain)
3. Deploy! Vercel handles HTTPS, global edge CDN, and atomic zero-downtime builds.

---

## 👨‍💻 Author & Maintainer

Built with ❤️ by **Adhil Ansari**
* 🌐 **Portfolio & Contact:** [adhilansari.vercel.app](https://adhilansari.vercel.app/)
* ☕ **Support the Project:** [buymeacoffee.com/adhilansari](https://buymeacoffee.com/adhilansari)

Feel free to connect for future updates, feature requests, or collaboration!

---

## 📜 Credits & License

- **Reciter:** Mishary Rashid Alafasy / Sheikh Abdul Basit
- **Malayalam Translation:** Cheriyamundam Abdul Hameed Madani & Kunhi Mohammed Parappoor
- **Scripture Source:** Tanzil Project & Al-Quran Cloud (Uthmani text)
- **License:** MIT — Open and free for personal and community use.
