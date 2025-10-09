import { TimePeriod } from '@/hooks/useHistoricalSensorData';

const UAE_TZ = 'Asia/Dubai';

export function formatUaeTime(date: Date | string | number, period: TimePeriod): string {
  const d = typeof date === 'object' ? date : new Date(date);
  
  switch (period) {
    case '10min':
      return d.toLocaleTimeString('en-GB', {
        hour12: false,
        timeZone: UAE_TZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    case '1hr':
      return d.toLocaleTimeString('en-GB', {
        hour12: false,
        timeZone: UAE_TZ,
        hour: '2-digit',
        minute: '2-digit'
      });
    case '8hr':
      return d.toLocaleString('en-GB', {
        timeZone: UAE_TZ,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case '24hr':
      return d.toLocaleDateString('en-GB', {
        timeZone: UAE_TZ,
        month: 'short',
        day: 'numeric'
      });
    default:
      return d.toLocaleTimeString('en-GB', {
        hour12: false,
        timeZone: UAE_TZ
      });
  }
}
