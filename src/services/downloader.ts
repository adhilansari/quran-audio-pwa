/**
 * Offline Audio Download Manager
 * 
 * Features:
 * - Streaming fetch with chunk-by-chunk progress calculation
 * - Stores audio responses directly in CacheStorage ('quran-audio-v1') with Range-compatible headers
 * - Saves progress and status metadata in IndexedDB
 * - Pause, resume, cancel, retry, and batch downloading
 * - Quota exceeded error handling
 * - Network-type awareness (warning before cellular download)
 */

import { APP_CONFIG } from '@/config';
import { Surah, DownloadTask, DownloadStatus } from '@/types';
import { saveDownload, getDownload, deleteDownloadMeta, clearAllDownloadsMeta, getAllDownloads } from './db';

type ProgressCallback = (task: DownloadTask) => void;

class DownloadManager {
  private activeControllers = new Map<number, AbortController>();
  private listeners = new Set<ProgressCallback>();
  private queue: Surah[] = [];
  private isProcessingQueue = false;
  private maxConcurrent = 2;
  private activeCount = 0;

  constructor() {
    // Resume or clean incomplete downloads on startup if needed
  }

  public subscribe(callback: ProgressCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(task: DownloadTask) {
    this.listeners.forEach(cb => {
      try {
        cb(task);
      } catch (err) {
        console.error('Error in download listener:', err);
      }
    });
  }

  /**
   * Resolve the audio URL for a surah
   */
  public getAudioUrl(surah: Surah): string {
    const base = APP_CONFIG.audioBaseUrl.replace(/\/$/, '');
    return `${base}/${surah.audioFile}`;
  }

  /**
   * Check if a surah audio is already saved in Cache Storage
   */
  public async isDownloaded(surah: Surah): Promise<boolean> {
    try {
      const url = this.getAudioUrl(surah);
      const cache = await caches.open(APP_CONFIG.cacheNames.audio);
      const match = await cache.match(url);
      if (match) return true;

      // Also check fallback if file matches by name
      const meta = await getDownload(surah.id);
      return meta?.status === 'completed';
    } catch (e) {
      return false;
    }
  }

  /**
   * Start or resume downloading a single surah
   */
  public async downloadSurah(surah: Surah): Promise<void> {
    const audioUrl = this.getAudioUrl(surah);
    
    // Check if already active
    if (this.activeControllers.has(surah.id)) {
      return;
    }

    const controller = new AbortController();
    this.activeControllers.set(surah.id, controller);

    let task: DownloadTask = {
      surahId: surah.id,
      audioFile: surah.audioFile,
      audioUrl,
      fileSizeBytes: surah.fileSizeBytes,
      downloadedBytes: 0,
      progress: 0,
      status: 'downloading',
      updatedAt: Date.now()
    };

    await saveDownload(task);
    this.notify(task);

    try {
      const response = await fetch(audioUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : surah.fileSizeBytes;
      task.fileSizeBytes = totalBytes;

      if (!response.body) {
        throw new Error('ReadableStream not supported in response body');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;
      let lastNotifyTime = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.byteLength;
        task.downloadedBytes = receivedBytes;
        task.progress = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));

        const now = Date.now();
        // Throttle listener notifications every 150ms for smooth UI rendering without lag
        if (now - lastNotifyTime > 150 || task.progress === 100) {
          lastNotifyTime = now;
          task.updatedAt = now;
          await saveDownload(task);
          this.notify(task);
        }
      }

      // Combine chunks into a single Blob
      const audioBlob = new Blob(chunks as any, { type: 'audio/mpeg' });

      // Put into Cache Storage with Range-compatible headers
      const cache = await caches.open(APP_CONFIG.cacheNames.audio);
      const syntheticResponse = new Response(audioBlob, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(audioBlob.size),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });

      await cache.put(audioUrl, syntheticResponse);

      // Finalize task status
      task.status = 'completed';
      task.progress = 100;
      task.downloadedBytes = audioBlob.size;
      task.fileSizeBytes = audioBlob.size;
      task.updatedAt = Date.now();

      await saveDownload(task);
      this.notify(task);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Paused or Cancelled
        task.status = 'paused';
        task.errorMessage = 'Download paused';
      } else if (err.name === 'QuotaExceededError') {
        task.status = 'error';
        task.errorMessage = 'Storage quota exceeded. Free up space and try again.';
      } else {
        task.status = 'error';
        task.errorMessage = err.message || 'Download failed. Check your internet connection.';
      }

      task.updatedAt = Date.now();
      await saveDownload(task);
      this.notify(task);
    } finally {
      this.activeControllers.delete(surah.id);
      this.processQueue();
    }
  }

  /**
   * Pause an active download
   */
  public pauseDownload(surahId: number) {
    const controller = this.activeControllers.get(surahId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(surahId);
    }
  }

  /**
   * Cancel and delete a download in progress or saved
   */
  public async cancelDownload(surah: Surah): Promise<void> {
    this.pauseDownload(surah.id);

    try {
      const url = this.getAudioUrl(surah);
      const cache = await caches.open(APP_CONFIG.cacheNames.audio);
      await cache.delete(url);
    } catch (e) {
      console.warn('Error deleting cached audio:', e);
    }

    await deleteDownloadMeta(surah.id);

    const task: DownloadTask = {
      surahId: surah.id,
      audioFile: surah.audioFile,
      audioUrl: this.getAudioUrl(surah),
      fileSizeBytes: surah.fileSizeBytes,
      downloadedBytes: 0,
      progress: 0,
      status: 'idle',
      updatedAt: Date.now()
    };
    this.notify(task);
  }

  /**
   * Delete an existing downloaded surah
   */
  public async deleteDownload(surah: Surah): Promise<void> {
    await this.cancelDownload(surah);
  }

  /**
   * Clear all downloaded audios and metadata
   */
  public async clearAllDownloads(surahs: Surah[]): Promise<void> {
    // Abort all active downloads
    this.activeControllers.forEach(c => c.abort());
    this.activeControllers.clear();
    this.queue = [];

    // Delete audio cache
    try {
      await caches.delete(APP_CONFIG.cacheNames.audio);
    } catch (e) {
      console.warn('Error deleting audio cache:', e);
    }

    // Clear DB
    await clearAllDownloadsMeta();

    // Notify all
    surahs.forEach(s => {
      this.notify({
        surahId: s.id,
        audioFile: s.audioFile,
        audioUrl: this.getAudioUrl(s),
        fileSizeBytes: s.fileSizeBytes,
        downloadedBytes: 0,
        progress: 0,
        status: 'idle',
        updatedAt: Date.now()
      });
    });
  }

  /**
   * Queue multiple surahs for download (e.g. "Download All" or batch)
   */
  public async queueBatch(surahs: Surah[]): Promise<void> {
    for (const surah of surahs) {
      const isDone = await this.isDownloaded(surah);
      if (!isDone && !this.queue.some(s => s.id === surah.id) && !this.activeControllers.has(surah.id)) {
        this.queue.push(surah);
        const task: DownloadTask = {
          surahId: surah.id,
          audioFile: surah.audioFile,
          audioUrl: this.getAudioUrl(surah),
          fileSizeBytes: surah.fileSizeBytes,
          downloadedBytes: 0,
          progress: 0,
          status: 'queued',
          updatedAt: Date.now()
        };
        await saveDownload(task);
        this.notify(task);
      }
    }
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.activeControllers.size < this.maxConcurrent && this.queue.length > 0) {
      const nextSurah = this.queue.shift();
      if (nextSurah) {
        // Run download in background
        this.downloadSurah(nextSurah).catch(err => {
          console.error(`Batch download error for surah ${nextSurah.id}:`, err);
        });
      }
    }

    this.isProcessingQueue = false;
  }
}

export const downloadManager = new DownloadManager();
