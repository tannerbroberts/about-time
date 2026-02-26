/**
 * Formats a duration in milliseconds to a human-readable string.
 * Examples:
 * - 60000 → "1 minute"
 * - 90000 → "1 minute 30 seconds"
 * - 3600000 → "1 hour"
 * - 3661000 → "1 hour 1 minute 1 second"
 */
export function formatDuration(ms: number): string {
  if (ms === 0) {
    return '0 seconds';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (remainingSeconds > 0) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ');
}
