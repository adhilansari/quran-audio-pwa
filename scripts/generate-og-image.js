import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  const svgContent = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="og-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06382b" />
      <stop offset="50%" stop-color="#042018" />
      <stop offset="100%" stop-color="#02110c" />
    </linearGradient>

    <!-- Logo Background Gradient -->
    <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>

    <!-- Golden Gradient -->
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde68a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Center Radial Glow -->
    <radialGradient id="og-glow" cx="50%" cy="32%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#042018" stop-opacity="0" />
    </radialGradient>

    <!-- Logo Shadow -->
    <filter id="logo-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000000" flood-opacity="0.65" />
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="${width}" height="${height}" fill="url(#og-bg)" />
  <rect width="${width}" height="${height}" fill="url(#og-glow)" />

  <!-- Subtle Islamic Geometric Background Pattern -->
  <g opacity="0.05" stroke="#fbbf24" stroke-width="1.5">
    <circle cx="600" cy="315" r="280" fill="none" />
    <circle cx="600" cy="315" r="190" fill="none" />
    <circle cx="600" cy="315" r="110" fill="none" />
    <polygon points="600,65 780,245 780,385 600,565 420,385 420,245" fill="none" />
    <polygon points="600,105 740,245 740,385 600,525 460,385 460,245" fill="none" />
  </g>

  <!-- Elegant Golden Border Frame -->
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.45" />
  <rect x="40" y="40" width="1120" height="550" rx="20" fill="none" stroke="#10b981" stroke-width="1" opacity="0.2" />

  <!-- Corner Dots -->
  <circle cx="56" cy="56" r="5" fill="#fbbf24" opacity="0.8" />
  <circle cx="1144" cy="56" r="5" fill="#fbbf24" opacity="0.8" />
  <circle cx="56" cy="574" r="5" fill="#fbbf24" opacity="0.8" />
  <circle cx="1144" cy="574" r="5" fill="#fbbf24" opacity="0.8" />

  <!-- OFFICIAL APP LOGO (Centered at top) -->
  <g filter="url(#logo-shadow)" transform="translate(515, 62) scale(0.332)">
    <!-- Background rounded squircle -->
    <rect width="512" height="512" rx="112" fill="url(#logo-bg)" stroke="url(#gold)" stroke-width="12" />

    <!-- Islamic 8-point geometric star pattern behind Quran -->
    <g opacity="0.18" stroke="url(#gold)" stroke-width="4" fill="none">
      <rect x="156" y="156" width="200" height="200" rx="20" />
      <rect x="156" y="156" width="200" height="200" rx="20" transform="rotate(45 256 256)" />
      <circle cx="256" cy="256" r="140" />
    </g>

    <!-- Decorative Outer Ring -->
    <circle cx="256" cy="256" r="216" stroke="url(#gold)" stroke-width="3" stroke-dasharray="8 6" opacity="0.4" fill="none" />

    <!-- Open Book Pages -->
    <path d="M 120 300 Q 190 260 256 280 Q 322 260 392 300 L 392 180 Q 322 140 256 160 Q 190 140 120 180 Z" fill="#faf8f5" />
    
    <!-- Gold Ribbon / Bookmark in center -->
    <path d="M 252 160 L 260 160 L 260 340 L 256 332 L 252 340 Z" fill="url(#gold)" />

    <!-- Quran Arabic Scripture lines decorative -->
    <line x1="150" y1="200" x2="230" y2="185" stroke="#065f46" stroke-width="4" stroke-linecap="round" opacity="0.75" />
    <line x1="145" y1="225" x2="235" y2="210" stroke="#065f46" stroke-width="4" stroke-linecap="round" opacity="0.75" />
    <line x1="155" y1="250" x2="225" y2="238" stroke="#065f46" stroke-width="4" stroke-linecap="round" opacity="0.75" />

    <line x1="282" y1="185" x2="362" y2="200" stroke="#065f46" stroke-width="4" stroke-linecap="round" opacity="0.75" />
    <line x1="277" y1="210" x2="367" y2="225" stroke="#065f46" stroke-width="4" stroke-linecap="round" opacity="0.75" />
    <line x1="287" y1="238" x2="357" y2="250" stroke="#065f46" stroke-width="4" stroke-linecap="round" opacity="0.75" />

    <!-- Sound waves / Headphones arching over Quran -->
    <path d="M 160 140 A 130 130 0 0 1 352 140" fill="none" stroke="url(#gold)" stroke-width="12" stroke-linecap="round" />
    <path d="M 185 155 A 95 95 0 0 1 327 155" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round" opacity="0.85" />

    <!-- Play symbol in gold badge at bottom -->
    <circle cx="256" cy="390" r="38" fill="url(#gold)" />
    <polygon points="250,374 270,390 250,406" fill="#064e3b" />
  </g>

  <!-- Main Malayalam Title: App instead of PWA -->
  <text x="600" y="290" text-anchor="middle" font-family="Noto Sans Malayalam, sans-serif" font-size="46" font-weight="bold" fill="#ffffff" letter-spacing="0.5">
    ഖുർആൻ മലയാളം ഓഡിയോ ആപ്പ്
  </text>

  <!-- English Title -->
  <text x="600" y="342" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="30" font-weight="700" fill="#fbbf24" letter-spacing="1">
    Quran Malayalam Audio App
  </text>

  <!-- Clear, Meaningful Features Description -->
  <text x="600" y="398" text-anchor="middle" font-family="Noto Sans Malayalam, Plus Jakarta Sans, sans-serif" font-size="22" font-weight="600" fill="#a7f3d0">
    സമ്പൂർണ്ണ 114 സൂറത്തുകൾ • ആയത്ത് തിലാവത്ത് • മലയാള പരിഭാഷ
  </text>

  <text x="600" y="438" text-anchor="middle" font-family="Noto Sans Malayalam, Plus Jakarta Sans, sans-serif" font-size="17" font-weight="500" fill="#6ee7b7" opacity="0.9">
    പരസ്യരഹിതം • മൊബൈൽ ഫോണുകളിലും കമ്പ്യൂട്ടറുകളിലും ഉപയോഗിക്കാൻ എളുപ്പമുള്ള ആപ്പ്
  </text>

  <!-- URL Button Badge (Clean & Centered) -->
  <g transform="translate(600, 508)">
    <rect x="-175" y="-22" width="350" height="44" rx="22" fill="#022c22" stroke="url(#gold)" stroke-width="1.5" />
    <text x="0" y="7" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="700" fill="#fbbf24">
      🌐 https://mlquran.vercel.app/
    </text>
  </g>

  <!-- Clean Tagline at bottom -->
  <text x="600" y="568" text-anchor="middle" font-family="Noto Sans Malayalam, Plus Jakarta Sans, sans-serif" font-size="14" font-weight="500" fill="#34d399" opacity="0.85">
    വിശുദ്ധ ഖുർആൻ കേൾക്കാനും വായിക്കാനും പഠിക്കാനും ഒരു ലളിതമായ ആപ്പ്
  </text>
</svg>
`;

  const svgBuffer = Buffer.from(svgContent);

  // Generate PNG version
  const pngPath = path.resolve(publicDir, 'og-image.png');
  await sharp(svgBuffer)
    .resize(width, height)
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(pngPath);
  console.log(`Generated OG Image (PNG): ${pngPath}`);

  // Generate JPG version
  const jpgPath = path.resolve(publicDir, 'og-image.jpg');
  await sharp(svgBuffer)
    .resize(width, height)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(jpgPath);
  console.log(`Generated OG Image (JPG): ${jpgPath}`);
}

generateOgImage().catch(err => {
  console.error('Error generating OG image:', err);
  process.exit(1);
});
