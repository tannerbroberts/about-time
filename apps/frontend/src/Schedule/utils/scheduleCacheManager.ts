import { getLanes } from '@about-time/api-client';

interface CacheEntry {
  startDate: string;
  endDate: string;
  data: Record<string, string>;
  timestamp: number;
}

/**
 * Smart cache manager for schedule data.
 * Tracks loaded date ranges and prevents redundant API calls.
 */
class ScheduleCacheManager {
  private cache: CacheEntry[] = [];
  private readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch schedule data for a date range, using cache when available.
   */
  async fetchForRange(startDate: string, endDate: string): Promise<Record<string, string>> {
    // Clean expired entries
    this.cleanExpiredEntries();

    // Check if range is fully covered by cache
    const cachedData = this.getCachedData(startDate, endDate);
    if (cachedData) {
      return cachedData;
    }

    // Fetch from API and cache
    const data = await getLanes(startDate, endDate);
    this.addToCache(startDate, endDate, data);
    return data;
  }

  /**
   * Get cached data if the requested range is fully covered.
   */
  private getCachedData(startDate: string, endDate: string): Record<string, string> | null {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Merge all overlapping cache entries
    const mergedData: Record<string, string> = {};
    let hasCoverage = false;

    for (const entry of this.cache) {
      const entryStart = new Date(entry.startDate);
      const entryEnd = new Date(entry.endDate);

      // Check if entry overlaps with requested range
      if (entryStart <= end && entryEnd >= start) {
        hasCoverage = true;
        Object.assign(mergedData, entry.data);
      }
    }

    // Check if we have complete coverage
    if (!hasCoverage) {
      return null;
    }

    // For simplicity, we return the merged data if we have any coverage
    // A more sophisticated implementation would verify complete coverage
    const hasCompleteCoverage = this.cache.some((entry) => {
      const entryStart = new Date(entry.startDate);
      const entryEnd = new Date(entry.endDate);
      return entryStart <= start && entryEnd >= end;
    });

    return hasCompleteCoverage ? mergedData : null;
  }

  /**
   * Add a new cache entry.
   */
  private addToCache(startDate: string, endDate: string, data: Record<string, string>): void {
    this.cache.push({
      startDate,
      endDate,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove expired cache entries.
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    this.cache = this.cache.filter((entry) => now - entry.timestamp < this.MAX_CACHE_AGE);
  }

  /**
   * Invalidate cache for a specific date or clear all cache.
   */
  invalidate(dateKey?: string): void {
    if (dateKey) {
      // Remove cache entries that contain this date
      const targetDate = new Date(dateKey);
      this.cache = this.cache.filter((entry) => {
        const entryStart = new Date(entry.startDate);
        const entryEnd = new Date(entry.endDate);
        return !(targetDate >= entryStart && targetDate <= entryEnd);
      });
    } else {
      // Clear all cache
      this.cache = [];
    }
  }
}

export const scheduleCacheManager = new ScheduleCacheManager();
