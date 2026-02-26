export const HOUR_HEIGHT = 60;

export interface TimeSlot {
  hour: number;
  label: string;
  yPosition: number;
}

export function generateTimeSlots(hourHeight: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push({
      hour,
      label: formatHour(hour),
      yPosition: hour * hourHeight,
    });
  }
  return slots;
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function timeToYPosition(date: Date, hourHeight: number): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalHours = hours + minutes / 60;
  return totalHours * hourHeight;
}

export function yPositionToTime(y: number, date: Date, hourHeight: number): Date {
  const totalHours = y / hourHeight;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);

  return roundToNearest15Minutes(newDate);
}

export function roundToNearest15Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;

  const newDate = new Date(date);
  newDate.setMinutes(roundedMinutes, 0, 0);

  return newDate;
}

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}
