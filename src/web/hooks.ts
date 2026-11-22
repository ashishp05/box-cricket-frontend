import { useQueries, useQuery } from '@tanstack/react-query';

import type { SlotGrid } from '@shared/api/types';
import { addDays, todayIST } from '@shared/lib/time';
import type { DayMark } from '@shared/ui/SlotPicker';

import { api, queryKeys } from './api';

export const useVenue = () => useQuery({ queryKey: queryKeys.venue, queryFn: api.venue, staleTime: 60_000 });
export const useOffers = () => useQuery({ queryKey: queryKeys.offers, queryFn: api.offers, staleTime: 60_000 });

export interface NextFree {
  date: string;
  hours: number[];
  pitchName: string;
}

// First day (from `from`) that still has free hours, with up to `limit` of those hours.
export const useNextFree = (from: string, limit = 5) => {
  const venue = useVenue();
  return useQuery({
    queryKey: ['next-free', from, limit],
    enabled: !!venue.data,
    staleTime: 30_000,
    queryFn: async (): Promise<NextFree | null> => {
      const v = venue.data!;
      const last = addDays(todayIST(), v.advanceDays);
      for (let date = from; date <= last; date = addDays(date, 1)) {
        const grid = await api.slots(date, v.pitches[0]?.id);
        const hours = grid.slots.filter((s) => s.status === 'available').map((s) => s.hour);
        if (hours.length) return { date, hours: hours.slice(0, limit), pitchName: v.pitches[0]?.name ?? 'Main Box' };
      }
      return null;
    },
  });
};

// Availability for every date in the strip: "full" (no free hour) or "open".
export const useDayMarks = (dates: string[], pitchId: string) => {
  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: queryKeys.slots(date, pitchId),
      queryFn: () => api.slots(date, pitchId),
      enabled: !!pitchId,
      staleTime: 30_000,
    })),
  });
  const marks: Record<string, DayMark> = {};
  results.forEach((r, i) => {
    const grid = r.data as SlotGrid | undefined;
    if (grid) marks[dates[i]] = grid.slots.some((s) => s.status === 'available') ? 'open' : 'full';
  });
  return marks;
};
