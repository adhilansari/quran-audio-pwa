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
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06382b" />
      <stop offset="50%" stop-color="#042018" />
      <stop offset="100%" stop-color="#02110c" />
    </linearGradient>

    <!-- Golden Accent Gradient -->
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Card Glow Gradient -->
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#042018" stop-opacity="0" />
    </radialGradient>

    <!-- Drop Shadow Filter -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />

  <!-- Subtle Islamic Geometric Pattern Grid -->
  <g opacity="0.06" stroke="#fbbf24" stroke-width="1.5">
    <circle cx="600" cy="315" r="280" fill="none" />
    <circle cx="600" cy="315" r="200" fill="none" />
    <circle cx="600" cy="315" r="120" fill="none" />
    <polygon points="600,75 770,245 770,385 600,555 430,385 430,245" fill="none" />
    <polygon points="600,115 740,255 740,375 600,515 460,375 460,255" fill="none" />
  </g>

  <!-- Subtle Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="28" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.4" />
  <rect x="36" y="36" width="1128" height="558" rx="20" fill="none" stroke="#10b981" stroke-width="1" opacity="0.25" />

  <!-- Corner Islamic Ornaments -->
  <circle cx="50" cy="50" r="6" fill="#fbbf24" opacity="0.7" />
  <circle cx="1150" cy="50" r="6" fill="#fbbf24" opacity="0.7" />
  <circle cx="50" cy="580" r="6" fill="#fbbf24" opacity="0.7" />
  <circle cx="1150" cy="580" r="6" fill="#fbbf24" opacity="0.7" />

  <!-- Quran Logo Icon Box with Shadow -->
  <g filter="url(#shadow)" transform="translate(536, 68)">
    <rect width="128" height="128" rx="32" fill="url(#gold)" />
    <!-- Book symbol in inner box -->
    <path d="M38 42 C 48 38, 58 38, 64 44 C 70 38, 80 38, 90 42 L 90 88 C 80 84, 70 84, 64 90 C 58 84, 48 84, 38 88 Z" fill="#064e3b" />
    <line x1="64" y1="44" x2="64" y2="90" stroke="#fbbf24" stroke-width="2.5" />
  </g>

  <!-- Main Malayalam Title -->
  <text x="600" y="255" text-anchor="middle" font-family="Noto Sans Malayalam, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" letter-spacing="0.5">
    ഖുർആൻ മലയാളം ഓഡിയോ
  </text>

  <!-- English Title -->
  <text x="600" y="305" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="28" font-weight="700" fill="#fbbf24" letter-spacing="1">
    Quran Malayalam Audio &amp; Player PWA
  </text>

  <!-- Subtitle / Tagline -->
  <text x="600" y="355" text-anchor="middle" font-family="Noto Sans Malayalam, Plus Jakarta Sans, sans-serif" font-size="19" font-weight="500" fill="#a7f3d0">
    പൂർണ്ണ 114 സൂറത്തുകൾ • ആയത്ത് പാരായണം • മലയാള പരിഭാഷ • 100% ഓഫ്‌ലൈൻ
  </text>

  <!-- Feature Pills Badges -->
  <g transform="translate(160, 400)">
    <!-- Pill 1 -->
    <g transform="translate(0, 0)">
      <rect width="195" height="48" rx="24" fill="#064e3b" stroke="#10b981" stroke-width="1.5" opacity="0.9" />
      <text x="97" y="30" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#fef08a">
        🎙️ മിഷാരി അൽ അഫാസി
      </text>
    </g>

    <!-- Pill 2 -->
    <g transform="translate(225, 0)">
      <rect width="215" height="48" rx="24" fill="#064e3b" stroke="#10b981" stroke-width="1.5" opacity="0.9" />
      <text x="107" y="30" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#fef08a">
        📖 ആയത്ത് തിലാവത്ത്
      </text>
    </g>

    <!-- Pill 3 -->
    <g transform="translate(470, 0)">
      <rect width="195" height="48" rx="24" fill="#064e3b" stroke="#10b981" stroke-width="1.5" opacity="0.9" />
      <text x="97" y="30" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#fef08a">
        📶 ഓഫ്‌ലൈൻ പ്ലെയർ
      </text>
    </g>

    <!-- Pill 4 -->
    <g transform="translate(695, 0)">
      <rect width="185" height="48" rx="24" fill="#064e3b" stroke="#10b981" stroke-width="1.5" opacity="0.9" />
      <text x="92" y="30" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#fef08a">
        ⚡ 100% സൗജന്യം
      </text>
    </g>
  </g>

  <!-- Footer Info Line -->
  <g transform="translate(600, 520)">
    <!-- URL Button Badge -->
    <rect x="-160" y="-18" width="320" height="38" rx="19" fill="#022c22" stroke="#fbbf24" stroke-width="1" />
    <text x="0" y="6" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="16" font-weight="700" fill="#fbbf24">
      🌐 mlquran.vercel.app
    </text>
  </g>

  <!-- Developer Signature -->
  <text x="600" y="565" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="500" fill="#6ee7b7" opacity="0.8">
    Crafted with ❤️ by Adhil Ansari • Progressive Web App (PWA)
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

  // Generate JPG version for maximum compatibility
  const jpgPath = path.resolve(publicDir, 'og-image.jpg');
  await sharp(svgBuffer)
    .resize(width, height)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(jpgPath);
  console.log(`Generated OG Image (JPG): ${jpgPath}`);
}

generateOgImage().catch(err => {
  console.error('Error generating OG image:', err);
  process.exit(1);
});
