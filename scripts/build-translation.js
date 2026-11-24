/**
 * Quran Malayalam Translation Parser Script
 * 
 * Converts raw chapter-wise translation text files ("one ayah followed by its translation")
 * into structured JSON: public/data/translations/{surahNumber}.json
 * Output format:
 * [
 *   {
 *     "ayah": 1,
 *     "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
 *     "malayalam": "പരമകാരുണികനും കരുണാനിധിയുമായ അല്ലാഹുവിന്റെ നാമത്തിൽ"
 *   }
 * ]
 * 
 * Usage:
 *   node scripts/build-translation.js --input ./raw_translations/ --out public/data/translations/
 *   node scripts/build-translation.js --file ./raw_translations/1.txt --surah 1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to detect if a text contains Arabic Unicode
function isArabic(text) {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

// Clean and normalize text
function cleanText(text) {
  if (!text) return '';
  return text.trim()
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Parses raw text content of a surah into ayah objects.
 * Handles flexible structures:
 * - Alternating Arabic line then Malayalam line
 * - Explicit numbered lines like:
 *     (1) بِسْمِ اللَّهِ ...
 *     1. പരമകാരുണികനും ...
 * - Blank line separated blocks
 */
export function parseSurahText(content, surahNumber = 1) {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const ayahs = [];
  let currentArabic = '';
  let currentMalayalam = '';
  let ayahCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is Arabic
    if (isArabic(line)) {
      // If we already had an Arabic line waiting for its translation, but another Arabic arrived:
      if (currentArabic && currentMalayalam) {
        ayahs.push({
          ayah: ayahCounter++,
          arabic: cleanText(currentArabic),
          malayalam: cleanText(currentMalayalam)
        });
        currentArabic = line;
        currentMalayalam = '';
      } else if (currentArabic && !currentMalayalam) {
        // Multi-line Arabic or continuation
        currentArabic += ' ' + line;
      } else {
        currentArabic = line;
      }
    } else {
      // Non-Arabic line (Malayalam translation or Ayah number)
      // Check if it's just a number like "1." or "(1)"
      const numMatch = line.match(/^[\(\[]?(\d+)[\)\]\.\:]\s*(.*)$/);
      let transText = line;
      if (numMatch && numMatch[2]) {
        transText = numMatch[2];
      }

      if (currentMalayalam) {
        currentMalayalam += ' ' + transText;
      } else {
        currentMalayalam = transText;
      }

      // Check if next line is Arabic or end of file -> finalize this ayah
      const nextLine = lines[i + 1];
      if (!nextLine || isArabic(nextLine)) {
        if (currentArabic) {
          ayahs.push({
            ayah: ayahCounter++,
            arabic: cleanText(currentArabic),
            malayalam: cleanText(currentMalayalam)
          });
          currentArabic = '';
          currentMalayalam = '';
        }
      }
    }
  }

  // Push any remaining item
  if (currentArabic) {
    ayahs.push({
      ayah: ayahCounter++,
      arabic: cleanText(currentArabic),
      malayalam: cleanText(currentMalayalam || '')
    });
  }

  return ayahs;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let inputDir = path.join(process.cwd(), 'raw_translations');
  let inputFile = null;
  let surahNum = null;
  let outDir = path.join(process.cwd(), 'public', 'data', 'translations');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputDir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      inputFile = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--surah' && args[i + 1]) {
      surahNum = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outDir = path.resolve(args[i + 1]);
      i++;
    }
  }

  return { inputDir, inputFile, surahNum, outDir };
}

function main() {
  const { inputDir, inputFile, surahNum, outDir } = parseArgs();

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Single file mode
  if (inputFile && fs.existsSync(inputFile)) {
    const num = surahNum || parseInt(path.basename(inputFile).match(/\d+/)?.[0] || '1', 10);
    const content = fs.readFileSync(inputFile, 'utf-8');
    const ayahs = parseSurahText(content, num);
    const dest = path.join(outDir, `${num}.json`);
    fs.writeFileSync(dest, JSON.stringify(ayahs, null, 2), 'utf-8');
    console.log(`Successfully parsed Surah ${num} (${ayahs.length} ayahs) -> ${dest}`);
    return;
  }

  // Directory mode
  if (fs.existsSync(inputDir)) {
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt') || f.endsWith('.raw'));
    console.log(`Found ${files.length} translation raw files in ${inputDir}`);
    
    files.forEach(file => {
      const numMatch = file.match(/\d+/);
      if (!numMatch) return;
      const num = parseInt(numMatch[0], 10);
      const content = fs.readFileSync(path.join(inputDir, file), 'utf-8');
      const ayahs = parseSurahText(content, num);
      const dest = path.join(outDir, `${num}.json`);
      fs.writeFileSync(dest, JSON.stringify(ayahs, null, 2), 'utf-8');
      console.log(`Parsed Surah ${num} -> ${dest} (${ayahs.length} ayahs)`);
    });
  } else {
    console.log(`Note: Raw translation directory '${inputDir}' not found.`);
    console.log(`To convert your raw translation files, put them in '${inputDir}' and run:`);
    console.log(`  npm run build:translation -- --input "${inputDir}"`);
  }
}

main();
