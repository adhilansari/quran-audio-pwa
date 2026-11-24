import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const iconsDir = path.resolve(rootDir, 'public/icons');
const publicDir = path.resolve(rootDir, 'public');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Base standard SVG (with squircle background)
const baseSvgPath = path.resolve(iconsDir, 'icon.svg');
const baseSvgContent = fs.readFileSync(baseSvgPath, 'utf-8');

// 2. Create Maskable SVG (full bleed rectangle, content within 80% safe zone for Android launcher shapes)
const maskableSvgContent = baseSvgContent
  // Replace rounded rect with full-bleed rect (no rx/ry)
  .replace('<rect width="512" height="512" rx="112" fill="url(#bg)" />', '<rect width="512" height="512" fill="url(#bg)" />')
  // Scale the inner elements slightly into the center 80% safe zone
  .replace(
    '<g filter="url(#shadow)">',
    '<g filter="url(#shadow)" transform="translate(51.2, 51.2) scale(0.8)">'
  );

const maskableSvgPath = path.resolve(iconsDir, 'icon-maskable.svg');
fs.writeFileSync(maskableSvgPath, maskableSvgContent, 'utf-8');

// Helper to convert SVG buffer to PNG using sharp
async function generatePng(svgBuffer, outputPath, width, height) {
  await sharp(svgBuffer)
    .resize(width, height, { fit: 'contain' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`Generated: ${path.relative(rootDir, outputPath)} (${width}x${height})`);
}

async function main() {
  console.log('--- Generating High-Res PWA & Browser Icons ---');

  const standardBuffer = Buffer.from(baseSvgContent);
  const maskableBuffer = Buffer.from(maskableSvgContent);

  // Standard PWA Icons
  await generatePng(standardBuffer, path.join(iconsDir, 'pwa-512x512.png'), 512, 512);
  await generatePng(standardBuffer, path.join(iconsDir, 'pwa-192x192.png'), 192, 192);
  await generatePng(standardBuffer, path.join(iconsDir, 'pwa-144x144.png'), 144, 144);
  await generatePng(standardBuffer, path.join(iconsDir, 'pwa-64x64.png'), 64, 64);

  // Maskable PWA Icons (for Android adaptive icons)
  await generatePng(maskableBuffer, path.join(iconsDir, 'maskable-icon-512x512.png'), 512, 512);
  await generatePng(maskableBuffer, path.join(iconsDir, 'maskable-icon-192x192.png'), 192, 192);

  // Apple Touch Icon (iOS Home Screen - 180x180)
  // Apple automatically applies rounded corners, so maskable or square with solid bg is ideal
  await generatePng(maskableBuffer, path.join(iconsDir, 'apple-touch-icon.png'), 180, 180);

  // Browser Favicons
  await generatePng(standardBuffer, path.join(iconsDir, 'favicon-48x48.png'), 48, 48);
  await generatePng(standardBuffer, path.join(iconsDir, 'favicon-32x32.png'), 32, 32);
  await generatePng(standardBuffer, path.join(iconsDir, 'favicon-16x16.png'), 16, 16);

  // Favicon.ico (generate 32x32 PNG and write as .ico)
  // Most modern browsers accept standard PNG-encoded .ico or 32x32 PNG
  const favicon32Buffer = await sharp(standardBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon32Buffer);
  fs.writeFileSync(path.join(iconsDir, 'favicon.ico'), favicon32Buffer);
  console.log('Generated: public/favicon.ico & public/icons/favicon.ico');

  console.log('✅ All icons generated successfully!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
