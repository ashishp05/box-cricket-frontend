import { useEffect, useState } from 'react';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Today's date in India, YYYY-MM-DD.
export const todayIST = (now = new Date()): string =>
  new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export const addDays = (date: string, days: number): string =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

export const dateRange = (from: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => addDays(from, i));

// The real instant an IST slot starts.
export const slotStart = (date: string, hour: number): Date =>
  new Date(new Date(`${date}T00:00:00+05:30`).getTime() + hour * 60 * 60 * 1000);

export const hoursUntil = (date: string, hour: number): number =>
  (slotStart(date, hour).getTime() - Date.now()) / (60 * 60 * 1000);

export const isWeekend = (date: string): boolean => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

// Seconds left until an ISO instant, ticking every second. null when no target.
export const useSecondsLeft = (target: string | null | undefined): number | null => {
  const compute = () => (target ? Math.max(0, Math.round((new Date(target).getTime() - Date.now()) / 1000)) : null);
  const [left, setLeft] = useState(compute);
  useEffect(() => {
    setLeft(compute());
    if (!target) return undefined;
    const id = window.setInterval(() => setLeft(compute()), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return left;
};

export const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
