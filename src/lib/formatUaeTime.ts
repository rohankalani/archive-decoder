import { TimePeriod } from '@/hooks/useHistoricalSensorData';

const UAE_TZ = 'Asia/Dubai';

export function formatUaeTime(date: Date | string | number, period: TimePeriod): string {
  const d = typeof date === 'object' ? date : new Date(date);
  
  switch (period) {
    case '10min':
      // Every 1 minute - show HH:MM only
      return d.toLocaleTimeString('en-GB', {
        hour12: false,
        timeZone: UAE_TZ,
        hour: '2-digit',
        minute: '2-digit'
      });
    case '1hr':
      // Every 5 minutes - show HH:MM only
      return d.toLocaleTimeString('en-GB', {
        hour12: false,
        timeZone: UAE_TZ,
        hour: '2-digit',
        minute: '2-digit'
      });
    case '8hr':
      // Every 1 hour - show date + time
      return d.toLocaleString('en-GB', {
        timeZone: UAE_TZ,
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', '');
    case '24hr':
      // Every 1 hour - show HH:MM only
      return d.toLocaleTimeString('en-GB', {
        hour12: false,
        timeZone: UAE_TZ,
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return d.toLocaleTimeString('en-GB', {
        hour12: false,
        timeZone: UAE_TZ
      });
  }
}
