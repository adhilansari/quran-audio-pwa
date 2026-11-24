import { Surah, Ayah } from '@/types';

/**
 * Wraps text into lines based on maxWidth in Canvas 2D
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Generates a high-resolution, beautifully styled Islamic image card for an Ayah.
 */
export async function generateAyahImageBlob(surah: Surah, ayah: Ayah): Promise<Blob> {
  const width = 1080;
  const padding = 70;
  const contentWidth = width - padding * 2;

  // Ensure custom web fonts are loaded if available
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch (e) {
    // Continue with system fallbacks
  }

  // Pre-calculate heights with dummy canvas
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d')!;

  // Measure Arabic lines
  mCtx.font = 'bold 44px "Amiri", "Scheherazade New", serif';
  const arabicLines = wrapText(mCtx, ayah.arabic, contentWidth);
  const arabicLineHeight = 84;
  const arabicBlockHeight = arabicLines.length * arabicLineHeight;

  // Measure Malayalam lines
  mCtx.font = '32px "Noto Sans Malayalam", "Manjari", sans-serif';
  const malayalamLines = wrapText(mCtx, ayah.malayalam, contentWidth);
  const malayalamLineHeight = 56;
  const malayalamBlockHeight = malayalamLines.length * malayalamLineHeight;

  // Calculate dynamic canvas height
  const headerHeight = 160;
  const dividerHeight = 80;
  const footerHeight = 120;
  const totalHeight = Math.max(
    1080,
    padding * 2 + headerHeight + arabicBlockHeight + dividerHeight + malayalamBlockHeight + footerHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // 1. Background Gradient (Deep emerald night)
  const bgGrad = ctx.createLinearGradient(0, 0, width, totalHeight);
  bgGrad.addColorStop(0, '#064e3b');
  bgGrad.addColorStop(0.5, '#042f24');
  bgGrad.addColorStop(1, '#021e17');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, totalHeight);

  // 2. Subtle Golden Radial Glow in Center
  const radialGlow = ctx.createRadialGradient(width / 2, totalHeight / 2, 80, width / 2, totalHeight / 2, 480);
  radialGlow.addColorStop(0, 'rgba(217, 119, 6, 0.12)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, totalHeight);

  // 3. Ornate Double Gold Border
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, width - 64, totalHeight - 64);

  ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(42, 42, width - 84, totalHeight - 84);

  // Corner Accents (Decorative corner diamonds)
  const drawCornerDiamond = (x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawCornerDiamond(32, 32);
  drawCornerDiamond(width - 32, 32);
  drawCornerDiamond(32, totalHeight - 32);
  drawCornerDiamond(width - 32, totalHeight - 32);

  let currentY = padding + 40;

  // 4. Header: Surah Name & Ayah Reference Badge
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 30px "Noto Sans Malayalam", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `വിശുദ്ധ ഖുർആൻ • സൂറത്ത് ${surah.malayalamName} (${surah.englishName})`,
    width / 2,
    currentY
  );

  currentY += 45;
  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 24px "Noto Sans Malayalam", sans-serif';
  ctx.fillText(`ആയത്ത് ${ayah.ayah} / ${surah.ayahCount}`, width / 2, currentY);

  currentY += 55;

  // Subtle header divider
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, currentY);
  ctx.lineTo(width / 2 + 140, currentY);
  ctx.stroke();

  currentY += 70;

  // 5. Arabic Scripture (RTL centered calligraphy)
  ctx.fillStyle = '#fef9c3';
  ctx.font = 'bold 44px "Amiri", "Scheherazade New", serif';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  for (const line of arabicLines) {
    ctx.fillText(line, width / 2, currentY);
    currentY += arabicLineHeight;
  }

  currentY += 15;

  // 6. Center Decorative Gold Medallion / Divider
  ctx.direction = 'ltr';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, currentY);
  ctx.lineTo(width / 2 - 25, currentY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width / 2 + 25, currentY);
  ctx.lineTo(width / 2 + 200, currentY);
  ctx.stroke();

  // Little star in center
  drawCornerDiamond(width / 2, currentY);

  currentY += 60;

  // 7. Malayalam Translation Lines
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '32px "Noto Sans Malayalam", "Manjari", sans-serif';
  ctx.textAlign = 'center';

  for (const line of malayalamLines) {
    ctx.fillText(line, width / 2, currentY);
    currentY += malayalamLineHeight;
  }

  // 8. Footer Watermark & Branding
  const footerY = totalHeight - 65;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, footerY - 30);
  ctx.lineTo(width - 80, footerY - 30);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px "Plus Jakarta Sans", "Noto Sans Malayalam", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📖 ഖുർആൻ മലയാളം ഓഡിയോ • mlquran.vercel.app', width / 2, footerY);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      'image/png',
      0.95
    );
  });
}

/**
 * Formatted plain text for sharing / clipboard
 */
export function formatAyahShareText(surah: Surah, ayah: Ayah): string {
  return `${ayah.arabic}\n\n${ayah.malayalam}\n\n[വിശുദ്ധ ഖുർആൻ ${surah.id}:${ayah.ayah} • ${surah.malayalamName}]\nhttps://mlquran.vercel.app/`;
}

/**
 * Share Ayah Image to Installed Social Media Apps (WhatsApp, Instagram, Telegram, etc.)
 */
export async function shareAyahImage(surah: Surah, ayah: Ayah): Promise<{ shared: boolean; downloaded?: boolean }> {
  try {
    const blob = await generateAyahImageBlob(surah, ayah);
    const fileName = `quran-${surah.id}-${ayah.ayah}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    // Check if Web Share API with Files is supported (Android, iOS Safari, macOS, Windows Edge/Chrome)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `ഖുർആൻ ${surah.malayalamName} (${surah.id}:${ayah.ayah})`,
        text: `വിശുദ്ധ ഖുർആൻ ${surah.malayalamName} (${surah.id}:${ayah.ayah})\nhttps://mlquran.vercel.app/`
      });
      return { shared: true };
    }

    // Fallback: Trigger direct image download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { shared: false, downloaded: true };
  } catch (err: any) {
    if (err.name === 'AbortError') return { shared: false };
    console.error('Error sharing ayah image:', err);
    throw err;
  }
}

/**
 * Copy Ayah Image Directly to Clipboard
 */
export async function copyAyahImageToClipboard(surah: Surah, ayah: Ayah): Promise<boolean> {
  try {
    const blob = await generateAyahImageBlob(surah, ayah);
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}
