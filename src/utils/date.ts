const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getLocalDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getIsoTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function diffDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_IN_MS);
}

export function isWithinDays(dateString: string, now: Date, days: number): boolean {
  if (days <= 0) {
    return false;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return diffDays(date, now) < days;
}
