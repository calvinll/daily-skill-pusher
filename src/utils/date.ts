const DAY_IN_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

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

export function getLocalWeekday(
  date: Date,
  timezone: string,
): 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  })
    .format(date)
    .toLowerCase();

  return WEEKDAY_MAP.find((value) => value === weekday) ?? 'monday';
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
