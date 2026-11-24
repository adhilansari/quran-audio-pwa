/**
 * Storage Manager
 * Uses navigator.storage API for persistence requests and quota estimation.
 */

export interface StorageEstimateResult {
  usageBytes: number;
  quotaBytes: number;
  usageMB: number;
  quotaMB: number;
  percentageUsed: number;
  isPersisted: boolean;
}

export async function getStorageEstimate(): Promise<StorageEstimateResult> {
  let usage = 0;
  let quota = 0;
  let isPersisted = false;

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usage = estimate.usage || 0;
      quota = estimate.quota || 0;
    } catch (e) {
      console.warn('Storage estimate failed:', e);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
    try {
      isPersisted = await navigator.storage.persisted();
    } catch (e) {
      console.warn('Checking storage persistence failed:', e);
    }
  }

  const usageMB = Math.round((usage / (1024 * 1024)) * 10) / 10;
  const quotaMB = Math.round((quota / (1024 * 1024)) * 10) / 10;
  const percentageUsed = quota > 0 ? Math.min(100, Math.round((usage / quota) * 100)) : 0;

  return {
    usageBytes: usage,
    quotaBytes: quota,
    usageMB,
    quotaMB,
    percentageUsed,
    isPersisted
  };
}

export async function requestStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch (e) {
      console.error('Failed to request persistent storage:', e);
      return false;
    }
  }
  return false;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
