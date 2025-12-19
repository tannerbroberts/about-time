/**
 * Time ledger utilities for calculating appropriate time intervals
 *
 * Rules:
 * - Interval should be between 1/10 and 1/20 of the total duration
 * - Prefer smaller intervals if there's a tie
 * - Never show months, use weeks instead
 * - Available units: milliseconds, seconds, minutes, hours, days, weeks
 */

// Time constants in milliseconds
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;

type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd' | 'w';

interface TimeInterval {
  value: number;
  unit: TimeUnit;
  msValue: number;
}

// Available interval steps in ascending order of milliseconds
// These are "nice" intervals that make sense for time display
const AVAILABLE_INTERVALS: TimeInterval[] = [
  // Milliseconds (100ms, 200ms, 500ms)
  { value: 100, unit: 'ms', msValue: 100 },
  { value: 200, unit: 'ms', msValue: 200 },
  { value: 500, unit: 'ms', msValue: 500 },
  // Seconds
  { value: 1, unit: 's', msValue: MS_PER_SECOND },
  { value: 2, unit: 's', msValue: MS_PER_SECOND * 2 },
  { value: 5, unit: 's', msValue: MS_PER_SECOND * 5 },
  { value: 10, unit: 's', msValue: MS_PER_SECOND * 10 },
  { value: 15, unit: 's', msValue: MS_PER_SECOND * 15 },
  { value: 30, unit: 's', msValue: MS_PER_SECOND * 30 },
  // Minutes
  { value: 1, unit: 'min', msValue: MS_PER_MINUTE },
  { value: 2, unit: 'min', msValue: MS_PER_MINUTE * 2 },
  { value: 5, unit: 'min', msValue: MS_PER_MINUTE * 5 },
  { value: 10, unit: 'min', msValue: MS_PER_MINUTE * 10 },
  { value: 15, unit: 'min', msValue: MS_PER_MINUTE * 15 },
  { value: 30, unit: 'min', msValue: MS_PER_MINUTE * 30 },
  // Hours
  { value: 1, unit: 'h', msValue: MS_PER_HOUR },
  { value: 2, unit: 'h', msValue: MS_PER_HOUR * 2 },
  { value: 3, unit: 'h', msValue: MS_PER_HOUR * 3 },
  { value: 4, unit: 'h', msValue: MS_PER_HOUR * 4 },
  { value: 6, unit: 'h', msValue: MS_PER_HOUR * 6 },
  { value: 12, unit: 'h', msValue: MS_PER_HOUR * 12 },
  // Days
  { value: 1, unit: 'd', msValue: MS_PER_DAY },
  { value: 2, unit: 'd', msValue: MS_PER_DAY * 2 },
  { value: 3, unit: 'd', msValue: MS_PER_DAY * 3 },
  { value: 7, unit: 'd', msValue: MS_PER_DAY * 7 }, // 1 week in days
  // Weeks
  { value: 1, unit: 'w', msValue: MS_PER_WEEK },
  { value: 2, unit: 'w', msValue: MS_PER_WEEK * 2 },
  { value: 4, unit: 'w', msValue: MS_PER_WEEK * 4 },
  { value: 8, unit: 'w', msValue: MS_PER_WEEK * 8 },
  { value: 13, unit: 'w', msValue: MS_PER_WEEK * 13 }, // ~quarter
  { value: 26, unit: 'w', msValue: MS_PER_WEEK * 26 }, // ~half year
  { value: 52, unit: 'w', msValue: MS_PER_WEEK * 52 }, // ~year
];

interface LedgerMark {
  position: number; // 0-1 percentage position
  label: string;
  msOffset: number;
}

interface LedgerConfigType {
  interval: TimeInterval;
  marks: LedgerMark[];
}

/**
 * Format a time value as a label using the specified unit
 */
function formatTimeLabel(ms: number, primaryUnit: TimeUnit): string {
  switch (primaryUnit) {
    case 'ms':
      return `${ms}ms`;
    case 's':
      return `${Math.round(ms / MS_PER_SECOND)}s`;
    case 'min':
      return `${Math.round(ms / MS_PER_MINUTE)}m`;
    case 'h':
      return `${Math.round(ms / MS_PER_HOUR)}h`;
    case 'd':
      return `${Math.round(ms / MS_PER_DAY)}d`;
    case 'w':
      return `${Math.round(ms / MS_PER_WEEK)}w`;
    default:
      return `${ms}ms`;
  }
}

/**
 * Calculate the best interval for a given duration.
 *
 * Rules:
 * - Interval must be >= duration / 20 (at most 20 marks)
 * - Interval must be <= duration / 10 (at least 10 marks)
 * - Prefer smaller intervals when multiple fit
 */
export function calculateLedgerConfig(durationMs: number): LedgerConfigType {
  const minInterval = durationMs / 20; // At most 20 marks
  const maxInterval = durationMs / 10; // At least 10 marks

  // Find the smallest interval that fits within our range
  // We prefer smaller intervals per the requirements
  let selectedInterval = AVAILABLE_INTERVALS[AVAILABLE_INTERVALS.length - 1];

  for (const interval of AVAILABLE_INTERVALS) {
    if (interval.msValue >= minInterval && interval.msValue <= maxInterval) {
      selectedInterval = interval;
      break; // Take the first (smallest) that fits
    }
    // If we've passed the maxInterval without finding a fit,
    // take the last one that was still below maxInterval
    if (interval.msValue > maxInterval) {
      break;
    }
    if (interval.msValue >= minInterval) {
      selectedInterval = interval;
      break;
    }
  }

  // If nothing in range, find the closest
  if (selectedInterval.msValue < minInterval || selectedInterval.msValue > maxInterval) {
    // Find the interval closest to our ideal range
    let bestFit = AVAILABLE_INTERVALS[0];
    let bestDistance = Infinity;

    for (const interval of AVAILABLE_INTERVALS) {
      let distance: number;
      if (interval.msValue < minInterval) {
        distance = minInterval - interval.msValue;
      } else if (interval.msValue > maxInterval) {
        distance = interval.msValue - maxInterval;
      } else {
        distance = 0;
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        bestFit = interval;
      }
    }
    selectedInterval = bestFit;
  }

  // Generate marks
  const marks: LedgerMark[] = [];
  let currentMs = 0;

  while (currentMs <= durationMs) {
    const position = currentMs / durationMs;
    const label = formatTimeLabel(currentMs, selectedInterval.unit);
    marks.push({ position, label, msOffset: currentMs });
    currentMs += selectedInterval.msValue;
  }

  return {
    interval: selectedInterval,
    marks,
  };
}

export type LedgerConfig = LedgerConfigType;

/**
 * Format a duration in a human-readable way
 */
export function formatDurationHuman(ms: number): string {
  if (ms < MS_PER_SECOND) {
    return `${ms}ms`;
  }
  if (ms < MS_PER_MINUTE) {
    const seconds = Math.round(ms / MS_PER_SECOND);
    return `${seconds}s`;
  }
  if (ms < MS_PER_HOUR) {
    const minutes = Math.round(ms / MS_PER_MINUTE);
    return `${minutes}m`;
  }
  if (ms < MS_PER_DAY) {
    const hours = Math.floor(ms / MS_PER_HOUR);
    const minutes = Math.round((ms % MS_PER_HOUR) / MS_PER_MINUTE);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (ms < MS_PER_WEEK) {
    const days = Math.floor(ms / MS_PER_DAY);
    const hours = Math.round((ms % MS_PER_DAY) / MS_PER_HOUR);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  const weeks = Math.floor(ms / MS_PER_WEEK);
  const days = Math.round((ms % MS_PER_WEEK) / MS_PER_DAY);
  return days > 0 ? `${weeks}w ${days}d` : `${weeks}w`;
}
