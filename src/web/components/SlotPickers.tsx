import { useMemo, useState } from 'react';
import { LuCheck, LuChevronLeft, LuChevronRight, LuLock, LuMoon, LuSun, LuSunrise, LuSunset, LuTimer } from 'react-icons/lu';

import type { Slot } from '@shared/api/types';
import { hourLabel, rupees } from '@shared/lib/format';
import { addDays } from '@shared/lib/time';
import { cx } from '@shared/ui/core';

export type DayMark = 'open' | 'full' | undefined;

const monthName = (ym: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${ym}-01T00:00:00Z`));
const shiftMonth = (ym: string, delta: number) => {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
};

// Month calendar. Days outside [min, max] are unavailable; marks say which bookable days still have free slots.
export const MonthCalendar = ({
  value,
  onChange,
  min,
  max,
  marks,
}: {
  value: string;
  onChange: (date: string) => void;
  min: string;
  max: string;
  marks: Record<string, DayMark>;
}) => {
  const [month, setMonth] = useState(value.slice(0, 7));
  const cells = useMemo(() => {
    const first = `${month}-01`;
    const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday first
    const days: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = first; d.slice(0, 7) === month; d = addDays(d, 1)) days.push(d);
    while (days.length % 7) days.push(null);
    // Drop whole weeks that ended before the first bookable day.
    let start = 0;
    while (start + 7 <= days.length && days.slice(start, start + 7).every((d) => !d || d < min)) start += 7;
    return days.slice(start);
  }, [month, min]);

  const canPrev = month > min.slice(0, 7);
  const canNext = month < max.slice(0, 7);

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} disabled={!canPrev} aria-label="Previous month">
          <LuChevronLeft />
        </button>
        <strong aria-live="polite">{monthName(month)}</strong>
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} disabled={!canNext} aria-label="Next month">
          <LuChevronRight />
        </button>
      </div>
      <div className="cal-grid" role="grid" aria-label="Choose a date">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span key={d} className="cal-dow" aria-hidden>
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const outside = d < min || d > max;
          const mark = marks[d];
          const full = mark === 'full';
          const state = outside ? 'unavailable' : full ? 'fully booked' : mark === 'open' ? 'available' : 'checking';
          return (
            <button
              key={d}
              type="button"
              className={cx('cal-day', outside && 'off', full && 'full', mark === 'open' && 'open', d === min && 'today')}
              aria-pressed={d === value}
              disabled={outside || full}
              onClick={() => onChange(d)}
              aria-label={`${d}, ${state}`}
            >
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="cal-legend" aria-hidden>
        <span>
          <i className="open" /> Available
        </span>
        <span>
          <i className="full" /> Fully booked
        </span>
        <span>
          <i className="off" /> Not open yet
        </span>
      </div>
    </div>
  );
};

// ---------- Time slots ----------

export type DayPart = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';

const parts: { id: Exclude<DayPart, 'all'>; label: string; icon: typeof LuSun; match: (h: number) => boolean }[] = [
  { id: 'morning', label: 'Morning', icon: LuSunrise, match: (h) => h >= 5 && h < 12 },
  { id: 'afternoon', label: 'Afternoon', icon: LuSun, match: (h) => h >= 12 && h < 17 },
  { id: 'evening', label: 'Evening', icon: LuSunset, match: (h) => h >= 17 && h < 21 },
  { id: 'night', label: 'Night', icon: LuMoon, match: (h) => h >= 21 || h < 5 },
];

// Display groups in clock order. The early hours (12-5 AM) belong to the selected date, so they come first.
const groupsDef: { key: string; part: Exclude<DayPart, 'all'>; label: string; range: string; icon: typeof LuSun; from: number; to: number }[] = [
  { key: 'early', part: 'night', label: 'Early hours', range: '12 – 5 AM', icon: LuMoon, from: 0, to: 5 },
  { key: 'morning', part: 'morning', label: 'Morning', range: '5 AM – 12 PM', icon: LuSunrise, from: 5, to: 12 },
  { key: 'afternoon', part: 'afternoon', label: 'Afternoon', range: '12 – 5 PM', icon: LuSun, from: 12, to: 17 },
  { key: 'evening', part: 'evening', label: 'Evening', range: '5 – 9 PM', icon: LuSunset, from: 17, to: 21 },
  { key: 'night', part: 'night', label: 'Night', range: '9 PM – 12 AM', icon: LuMoon, from: 21, to: 24 },
];

export const SlotLegend = () => (
  <div className="slot-legend" aria-hidden>
    <span>
      <i className="available" /> Available
    </span>
    <span>
      <i className="selected" /> Selected
    </span>
    <span>
      <i className="booked" /> Booked
    </span>
    <span>
      <i className="held" /> Reserved
    </span>
  </div>
);

// Hourly slot grid with day-part filters. Selected hours are lime, free green, booked grey, held orange.
export const TimeSlots = ({
  slots,
  selected,
  onToggle,
  ownHours = [],
  showPrice = true,
}: {
  slots: Slot[];
  selected: number[];
  onToggle: (hour: number) => void;
  // A booking's own hours while rescheduling: free for that booking.
  ownHours?: number[];
  showPrice?: boolean;
}) => {
  const [part, setPart] = useState<DayPart>('all');
  const upcoming = slots.filter((s) => s.status !== 'past');
  const isFree = (s: Slot) => s.status === 'available' || ownHours.includes(s.hour);
  const freeIn = (match: (h: number) => boolean) => upcoming.filter((s) => match(s.hour) && isFree(s)).length;

  const groups = groupsDef
    .filter((g) => part === 'all' || g.part === part)
    .map((g) => ({ ...g, slots: upcoming.filter((s) => s.hour >= g.from && s.hour < g.to) }))
    .filter((g) => g.slots.length > 0);

  return (
    <div className="ts">
      <div className="ts-filters" role="tablist" aria-label="Time of day">
        <button type="button" role="tab" aria-selected={part === 'all'} onClick={() => setPart('all')}>
          All <small>{freeIn(() => true)}</small>
        </button>
        {parts.map(({ id, label, icon: Icon, match }) => (
          <button key={id} type="button" role="tab" aria-selected={part === id} onClick={() => setPart(id)}>
            <Icon aria-hidden /> {label} <small>{freeIn(match)}</small>
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="ts-empty">
          <LuMoon aria-hidden />
          <strong>No {part === 'all' ? '' : part} slots left on this day</strong>
          <span>Try another time of day or pick a different date.</span>
        </div>
      ) : (
        groups.map((g) => {
          const Icon = g.icon;
          const free = g.slots.filter(isFree).length;
          return (
            <section key={g.key} className="ts-group" aria-label={g.label}>
              <header>
                <Icon aria-hidden />
                <strong>{g.label}</strong>
                <small>{g.range}</small>
                <span className={free ? 'free' : 'none'}>{free ? `${free} free` : 'Full'}</span>
              </header>
              <div className="ts-grid">
                {g.slots.map((s) => {
                  const own = ownHours.includes(s.hour);
                  const free = isFree(s);
                  const sel = selected.includes(s.hour);
                  const state = sel ? 'selected' : free ? 'available' : s.status === 'held' ? 'held' : 'booked';
                  return (
                    <button
                      key={s.hour}
                      type="button"
                      className={cx('ts-slot', state)}
                      disabled={!free}
                      aria-pressed={sel}
                      onClick={() => onToggle(s.hour)}
                      aria-label={`${hourLabel(s.hour)} to ${hourLabel(s.hour + 1)}, ${own ? 'your current slot' : state === 'held' ? 'reserved' : state}`}
                    >
                      <span className="t">{hourLabel(s.hour)}</span>
                      <span className="to">to {hourLabel(s.hour + 1)}</span>
                      <span className="m">
                        {own && !sel ? 'Your slot' : free ? (showPrice ? rupees(s.price) : 'Free') : state === 'held' ? 'Reserved' : 'Booked'}
                      </span>
                      {sel ? (
                        <LuCheck className="corner" aria-hidden />
                      ) : state === 'booked' ? (
                        <LuLock className="corner" aria-hidden />
                      ) : state === 'held' ? (
                        <LuTimer className="corner" aria-hidden />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

// Consecutive-hour selection: adjacent hours extend, the ends trim, anything else restarts.
export const toggleHour = (selected: number[], hour: number): { hours: number[]; reset: boolean } => {
  if (selected.length === 0) return { hours: [hour], reset: false };
  const min = Math.min(...selected);
  const max = Math.max(...selected);
  if (selected.includes(hour)) {
    if (hour === min || hour === max) return { hours: selected.filter((h) => h !== hour), reset: false };
    return { hours: [hour], reset: true };
  }
  if (hour === max + 1 || hour === min - 1) return { hours: [...selected, hour].sort((a, b) => a - b), reset: false };
  return { hours: [hour], reset: true };
};
