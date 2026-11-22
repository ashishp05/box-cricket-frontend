import type { ReactNode } from 'react';
import { MdCalendarMonth, MdCheck, MdCheckCircle, MdLockOutline, MdNightsStay, MdOutlineBedtime, MdOutlineTimer, MdOutlineWbSunny, MdWbSunny, MdWbTwilight } from 'react-icons/md';

import type { Slot } from '../api/types';
import { dayOfMonth, hourLabel, monthShort, rupees, weekdayShort } from '../lib/format';
import { cx } from './core';

export type DayMark = 'full' | 'open' | undefined;

// "1. Pick a date" strip: day cards (Full / open dot) plus a calendar picker for any allowed date.
export const DateStrip = ({
  dates,
  value,
  onChange,
  marks = {},
  min,
  max,
}: {
  dates: string[];
  value: string;
  onChange: (date: string) => void;
  marks?: Record<string, DayMark>;
  min?: string;
  max?: string;
}) => (
  <div className="dates">
    <div className="dates-scroll" role="group" aria-label="Choose a date">
      {dates.map((date) => {
        const mark = marks[date];
        return (
          <button
            type="button"
            key={date}
            className={cx('date-card', mark === 'full' && 'full')}
            aria-pressed={date === value}
            onClick={() => onChange(date)}
            aria-label={`${date}${mark === 'full' ? ', fully booked' : ''}`}
          >
            <span className="dow">{weekdayShort(date)}</span>
            <span className="dom">{dayOfMonth(date)}</span>
            <span className="mon">{monthShort(date)}</span>
            {mark === 'full' ? <span className="mark">Full</span> : mark === 'open' ? <span className="mark dot" /> : null}
          </button>
        );
      })}
    </div>
    <label className="date-pick" aria-label="Pick a date from the calendar">
      <MdCalendarMonth />
      <input type="date" value={value} min={min} max={max} onChange={(e) => e.target.value && onChange(e.target.value)} />
    </label>
  </div>
);

const groups: { title: string; range: string; from: number; to: number; icon: ReactNode }[] = [
  { title: 'Late night', range: '12 AM - 6 AM', from: 0, to: 6, icon: <MdOutlineBedtime /> },
  { title: 'Morning', range: '6 AM - 12 PM', from: 6, to: 12, icon: <MdOutlineWbSunny /> },
  { title: 'Afternoon', range: '12 PM - 4 PM', from: 12, to: 16, icon: <MdWbSunny /> },
  { title: 'Evening', range: '4 PM - 8 PM', from: 16, to: 20, icon: <MdWbTwilight /> },
  { title: 'Night', range: '8 PM - 12 AM', from: 20, to: 24, icon: <MdNightsStay /> },
];

// "2. Select time": grouped hourly tiles. Booked = struck through with a lock, held = "On hold".
export const SlotGrid = ({
  slots,
  selected,
  onToggle,
  ownHours = [],
  showPrice = true,
}: {
  slots: Slot[];
  selected: number[];
  onToggle: (hour: number) => void;
  // A booking's own hours while rescheduling: shown as free for that booking.
  ownHours?: number[];
  showPrice?: boolean;
}) => {
  const visible = groups
    .map((g) => ({ ...g, slots: slots.filter((s) => s.hour >= g.from && s.hour < g.to && s.status !== 'past') }))
    .filter((g) => g.slots.length > 0);

  return (
    <div>
      {visible.map((g) => {
        const free = g.slots.filter((s) => s.status === 'available' || ownHours.includes(s.hour)).length;
        return (
          <div className="slot-group" key={g.title}>
            <div className="slot-group-head">
              {g.icon}
              <strong>{g.title}</strong>
              <small>{g.range}</small>
              <span className="free">{free} free</span>
            </div>
            <div className="slot-grid">
              {g.slots.map((slot) => {
                const own = ownHours.includes(slot.hour);
                const isFree = slot.status === 'available' || own;
                const isSelected = selected.includes(slot.hour);
                const state = isSelected ? 'selected' : isFree ? '' : slot.status;
                return (
                  <button
                    key={slot.hour}
                    type="button"
                    className={cx('slot', state)}
                    disabled={!isFree}
                    aria-pressed={isSelected}
                    onClick={() => onToggle(slot.hour)}
                    aria-label={`${slot.label}, ${own ? 'your current slot' : isFree ? 'available' : slot.status === 'held' ? 'on hold' : 'booked'}`}
                  >
                    <span className="time">{hourLabel(slot.hour)}</span>
                    <span className="meta">
                      {own && !isSelected ? 'Your slot' : isFree ? (showPrice ? rupees(slot.price) : 'Available') : slot.status === 'held' ? 'On hold' : 'Booked'}
                    </span>
                    {isSelected ? (
                      <MdCheckCircle className="corner" aria-hidden />
                    ) : slot.status === 'booked' && !own ? (
                      <MdLockOutline className="corner" aria-hidden />
                    ) : slot.status === 'held' && !own ? (
                      <MdOutlineTimer className="corner" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SlotLegend = () => (
  <div className="legend" aria-hidden>
    <span>
      <i /> Available
    </span>
    <span>
      <i className="sel">
        <MdCheck />
      </i>{' '}
      Selected
    </span>
    <span>
      <i className="off">
        <MdLockOutline />
      </i>{' '}
      Booked
    </span>
    <span>
      <i className="hold">
        <MdOutlineTimer />
      </i>{' '}
      On hold
    </span>
  </div>
);

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
