import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'data', 'translations');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchSurahWithRetry(id) {
  const destFile = path.join(outDir, `${id}.json`);
  if (fs.existsSync(destFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(destFile, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return true;
      }
    } catch (e) {}
  }

  const url = `https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,ml.abdulhameed`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.warn(`Rate limited on Surah ${id}, waiting 3s before retry ${attempt}...`);
        await sleep(3000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.code === 200 && json.data && json.data.length >= 2) {
        const arAyahs = json.data[0].ayahs;
        const mlAyahs = json.data[1].ayahs;

        const paired = arAyahs.map((ar, idx) => ({
          ayah: ar.numberInSurah,
          arabic: ar.text,
          malayalam: mlAyahs[idx]?.text || '',
          globalAyahNumber: ar.number
        }));

        fs.writeFileSync(destFile, JSON.stringify(paired, null, 2), 'utf-8');
        console.log(`✓ Generated Surah ${id}: ${paired.length} ayahs`);
        return true;
      }
    } catch (err) {
      console.warn(`Attempt ${attempt} for Surah ${id} failed:`, err.message);
      await sleep(1500);
    }
  }
  return false;
}

async function main() {
  console.log('Downloading missing Surahs...');
  for (let i = 1; i <= 114; i++) {
    const destFile = path.join(outDir, `${i}.json`);
    if (!fs.existsSync(destFile)) {
      await fetchSurahWithRetry(i);
      await sleep(800);
    }
  }
  console.log('Finished checking all 114 surahs.');
}

main();
