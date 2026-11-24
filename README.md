# Quran Malayalam Audio (ഖുർആൻ മലയാളം ഓഡിയോ)

A production-ready, offline-first Progressive Web App (PWA) Quran audio player featuring complete chapter-by-chapter recitation with Malayalam translation, ayah-by-ayah reading view, Media Session API for background/lock-screen controls, and true offline caching with HTTP Range request support for seamless seeking across Android and iOS Safari.

---

## 🌟 Key Features

1. **Dual Language UI (Malayalam & English):** Instant language toggle, preserving complete RTL layout for Arabic Uthmani text alongside clear Malayalam typography (*Noto Sans Malayalam* / *Manjari*).
2. **Offline-First Audio Architecture:**
   - Stream Surah audio dynamically from Cloudflare R2 when online.
   - One-tap or batch download surahs with real-time progress (`0%–100%`).
   - Custom Service Worker with **HTTP Range Request slicing** (`206 Partial Content`) so offline seeking works flawlessly on iOS Safari and Android Chrome.
   - Persistent storage requests (`navigator.storage.persist()`) and quota estimation (`navigator.storage.estimate()`).
3. **Audio Player Engine:**
   - Sticky bottom Mini-Player & Full-screen modal player.
   - Controls: Play/Pause, ±15s fast scrub, seek bar, previous/next surah, speed control (0.75x–2.0x), repeat (off/surah/all).
   - Sleep timer (15m, 30m, 45m, 60m, end of surah) with countdown display.
   - Full **Media Session API** integration (album art, reciter name, lock-screen notification controls).
   - Position auto-resume from last listening session.
4. **Ayah-by-Ayah Malayalam Reader:**
   - Arabic scripture (Amiri Uthmani script) paired directly above Malayalam translation.
   - Independent Font Size Sliders (A- / A+) for both scripts.
   - Eye toggles to show/hide Arabic text or Malayalam translation.
   - Optional Ayah-level timestamp highlighting (`timings/{surah}.json`) with auto-scroll. If timings are omitted, falls back smoothly without faking.
   - Bookmarking individual Ayahs or entire Surahs into IndexedDB.
5. **Modern PWA:**
   - Installable on iOS (Safari Add to Home Screen) and Android (Native install prompt).
   - App shell and JSON translations precached via Workbox.
   - Update prompt banner when new app versions deploy.

---

## 📁 Project Structure

```
quran-audio-pwa/
├── public/
│   ├── data/
│   │   ├── surahs.json                 # 114 Surahs metadata manifest
│   │   ├── translations/
│   │   │   ├── 1.json                  # Surah 1 (Al-Fatihah) translation
│   │   │   ├── 112.json                # Surah 112 (Al-Ikhlas)
│   │   │   ├── 113.json                # Surah 113 (Al-Falaq)
│   │   │   └── 114.json                # Surah 114 (An-Nas)
│   │   └── timings/
│   │       └── 1.json                  # Surah 1 Ayah-level timestamps
│   ├── icons/
│   │   ├── icon.svg                    # Vector brand icon
│   │   ├── pwa-192x192.png             # 192px PWA icon
│   │   ├── pwa-512x512.png             # 512px PWA maskable icon
│   │   └── apple-touch-icon.png        # iOS Home icon
│   └── favicon.ico
├── scripts/
│   ├── build-manifest.js               # Scans audio directory & creates surahs.json
│   ├── build-translation.js            # Parses raw chapter text into translations JSON
│   └── generate-icons.js               # PWA icon generator helper
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx               # 5-tab persistent bottom navigation
│   │   ├── FullPlayer.tsx              # Full-screen player modal with scrubber
│   │   ├── MiniPlayer.tsx              # Sticky persistent mini player
│   │   ├── Navbar.tsx                  # Top brand, online/offline badge, theme & lang
│   │   └── StorageManager.tsx          # IndexedDB / Cache storage monitor & persist
│   ├── contexts/
│   │   ├── AudioContext.tsx            # HTML5 Audio, Media Session, Sleep Timer
│   │   └── SettingsContext.tsx         # Theme, UI strings, font sizes, install prompt
│   ├── data/
│   │   └── surahs.json                 # Bundled manifest mirror
│   ├── services/
│   │   ├── db.ts                       # IndexedDB (idb) schema & queries
│   │   ├── downloader.ts               # Streaming fetch download manager
│   │   └── storage.ts                  # Storage persistence & quota manager
│   ├── styles/
│   │   └── index.css                   # Tailwind v4, fonts & Islamic design tokens
│   ├── types/
│   │   └── index.ts                    # TypeScript data contracts & models
│   ├── views/
│   │   ├── BookmarksView.tsx           # Bookmarked Ayahs and Surahs
│   │   ├── DownloadsView.tsx           # Offline manager & batch download
│   │   ├── HomeView.tsx                # Daily Ayah, continue listening, quick access
│   │   ├── ReaderView.tsx              # Ayah-by-ayah reading & audio sync
│   │   ├── SettingsView.tsx            # Theme, language, fonts, credits
│   │   └── SurahListView.tsx           # Search & filter tabs (All, Downloaded, Saved)
│   ├── App.tsx                         # Main app router & layout
│   ├── config.ts                       # Centralized configuration (audio URL, branding)
│   ├── main.tsx                        # React DOM root & SW update registration
│   ├── sw.ts                           # Workbox Service Worker with Range Request slicer
│   └── vite-env.d.ts                   # Vite & PWA type declarations
├── raw_translations/
│   └── 1.txt                           # Sample raw text file for build-translation.js
├── r2-cors.json                        # Cloudflare R2 CORS configuration
├── index.html                          # Entry HTML with Amiri & Noto fonts
├── package.json
├── tsconfig.json
└── vite.config.ts                      # Vite + Tailwind + VitePWA config
```

---

## 🛠️ Data Preparation Scripts

### 1. Audio Manifest Generator (`scripts/build-manifest.js`)
Scans any local folder of audio files (e.g. `malayalam quran mp3`), calculates byte sizes, matches non-standard prefixes (such as `000_Al_Fattiha.mp3`), and correlates with all 114 canonical Surahs with Arabic and Malayalam titles:
```bash
node scripts/build-manifest.js --dir "./malayalam quran mp3" --out "./public/data/surahs.json"
```

### 2. Translation Parser (`scripts/build-translation.js`)
Takes raw chapter text files where each verse is followed by its Malayalam translation and generates standard JSON `translations/{surahNumber}.json`:
```bash
# Convert a single raw file
node scripts/build-translation.js --file "./raw_translations/1.txt" --surah 1

# Or convert an entire directory of text files (e.g. 1.txt to 114.txt)
node scripts/build-translation.js --input "./raw_translations" --out "./public/data/translations"
```

---

## ⚙️ Service Worker & Offline Range Requests (Technical Deep-Dive)

### Why iOS Safari Fails Without Range Requests
When an HTML5 `<audio>` tag plays media on mobile Safari:
1. Safari sends an HTTP request with the header `Range: bytes=0-1` to inspect the container header and duration.
2. When the user seeks or scrubs, Safari issues byte range requests (e.g., `Range: bytes=10485760-`).
3. Standard Service Worker caches (`caches.match(event.request)`) return an HTTP `200 OK` full body response if stored directly. On iOS Safari, returning a 200 to a Range request causes Safari to refuse seeking, truncate playback, or fail completely.

### How Our Service Worker Solves This:
In [src/sw.ts](src/sw.ts):
```ts
// If client requested a partial range (bytes=start-end)
if (rangeHeader) {
  const arrayBuffer = await cachedResponse.arrayBuffer();
  const total = arrayBuffer.byteLength;
  const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (matches) {
    const start = matches[1] ? parseInt(matches[1], 10) : 0;
    const end = matches[2] ? parseInt(matches[2], 10) : total - 1;
    const slice = arrayBuffer.slice(start, end + 1);

    return new Response(slice, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(slice.byteLength),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  }
}
```
This synthetic `206 Partial Content` response satisfies iOS Safari, iPadOS, Android Chrome, and Desktop browsers seamlessly.

---

## ☁️ Deployment Guide (100% Free Tiers)

### 1. Cloudflare R2 Audio Hosting

Cloudflare R2 provides **10 GB of free storage and zero egress bandwidth fees** (saving hundreds of dollars compared to AWS S3).

#### Step 1: Create an R2 Bucket
1. Sign in to your Cloudflare dashboard and go to **R2**.
2. Click **Create bucket** and name it `quran-audio-malayalam`.

#### Step 2: Upload 114 MP3 Files (~1.31 GB)
You can upload via Cloudflare Dashboard drag-and-drop, or use **rclone** / **wrangler**:

**Using Wrangler CLI:**
```bash
npm install -g wrangler
wrangler r2 object put quran-audio-malayalam/000_Al_Fattiha.mp3 --file="./malayalam quran mp3/000_Al_Fattiha.mp3"
```

**Using rclone (Fast batch upload for 1.31 GB):**
```bash
# In rclone config, add your Cloudflare R2 S3-compatible credentials
rclone copy "./malayalam quran mp3" "r2:quran-audio-malayalam/audio" --progress --transfers=8
```

#### Step 3: Enable Public Access & Custom Domain
1. In your R2 bucket settings, click **Settings** -> **Public access**.
2. Either click **Allow Public Access** (gives you a URL like `https://pub-xxxxxx.r2.dev`) OR connect a custom domain like `audio.yourdomain.com`.

#### Step 4: Apply CORS Policy
In the R2 bucket settings under **CORS Policy**, paste the contents of `r2-cors.json`:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges", "ETag"],
    "MaxAgeSeconds": 86400
  }
]
```

#### Step 5: Configure the URL in the App
Edit `src/config.ts`:
```ts
audioBaseUrl: "https://pub-xxxxxx.r2.dev/audio" // or your custom domain
```
Or set the environment variable:
```bash
VITE_AUDIO_BASE_URL="https://pub-xxxxxx.r2.dev/audio"
```

---

### 2. Deploying the Web App

#### Option A: Deploy to Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add Environment Variable:
   - `VITE_AUDIO_BASE_URL`: `https://pub-xxxxxx.r2.dev/audio`
8. Click **Deploy**. Vercel automatically assigns HTTPS and high-speed global edge CDN.

#### Option B: Deploy to Cloudflare Pages
1. Go to **Workers & Pages** in Cloudflare dashboard -> **Create application** -> **Pages**.
2. Connect your Git repository.
3. Build preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

#### Option C: Deploy to GitHub Pages
If deploying to GitHub Pages under a subpath (e.g. `username.github.io/quran-audio-pwa`):
1. In `vite.config.ts`, set `base: '/quran-audio-pwa/'`.
2. Push to branch `gh-pages` or use GitHub Actions.

---

## 🧪 Testing Checklist

- [x] **Desktop Chrome / Edge:**
  - Open app, test instant search across Arabic, English, and Malayalam.
  - Test audio playback, seek bar scrubbing, ±15s buttons, speed selector.
  - Test download of Surah 1 (Al-Fatihah), verify offline badge turns green.
  - Open DevTools -> Network -> toggle "Offline" -> verify downloaded Surah plays and seeks with zero errors.
- [x] **Android Chrome:**
  - Tap "Install App" button or three-dot menu -> "Add to Home screen".
  - Lock the screen during playback -> verify notification bar shows Surah title, Qari name, and lock-screen seek controls.
- [x] **iOS Safari (iPhone / iPad):**
  - Open Safari, tap Share -> "Add to Home Screen".
  - Open installed standalone app -> download Surah -> turn on Airplane Mode.
  - Test playback and scrub forward/backward to verify HTTP Range request slicing.
- [x] **Lighthouse Audit:**
  - Run Lighthouse in Chrome DevTools: PWA badge active, manifest validated, fast TTI, initial JS bundle ~103 KB gzipped.
