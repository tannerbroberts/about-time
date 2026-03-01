export type ViewType = 'day' | 'week' | 'month' | 'year';

interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get the date range for a given view type centered on a specific date.
 */
export function getDateRangeForView(centerDate: Date, view: ViewType): DateRange {
  const date = new Date(centerDate);

  switch (view) {
    case 'day':
      // Single day
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999),
      };

    case 'week': {
      // Week containing the date (Monday to Sunday)
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(date);
      monday.setDate(date.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return { start: monday, end: sunday };
    }

    case 'month':
      // First to last day of the month
      return {
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
      };

    case 'year':
      // January 1 to December 31
      return {
        start: new Date(date.getFullYear(), 0, 1),
        end: new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999),
      };

    default:
      throw new Error(`Unknown view type: ${view}`);
  }
}

/**
 * Format a date as YYYY-MM-DD for use as a date key.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date key (YYYY-MM-DD) falls within a date range.
 */
export function isDateInRange(dateKey: string, start: Date, end: Date): boolean {
  const date = new Date(dateKey);
  return date >= start && date <= end;
}
