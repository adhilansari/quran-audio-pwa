import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

const surahsData = JSON.parse(
  fs.readFileSync(path.resolve(rootDir, 'src/data/surahs.json'), 'utf-8')
);

const baseUrl = 'https://mlquran.vercel.app';
const currentDate = new Date().toISOString().split('T')[0];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

// Add All 114 Surahs
surahsData.forEach((surah) => {
  sitemap += `  <url>
    <loc>${baseUrl}/?surah=${surah.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
});

sitemap += `</urlset>\n`;

fs.writeFileSync(path.resolve(publicDir, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`Generated sitemap.xml with ${surahsData.length + 1} URLs.`);
