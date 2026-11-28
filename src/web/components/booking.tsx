// Building blocks shared by the booking steps and My Bookings.
import type { ReactNode } from 'react';
import { LuCalendarDays, LuCircleAlert, LuClock, LuHourglass, LuMapPin, LuTimer } from 'react-icons/lu';

import type { Booking, Price } from '@shared/api/types';
import { hourLabel, hoursText, longDate, rupees, shortDate } from '@shared/lib/format';
import { clock } from '@shared/lib/time';
import { cx } from '@shared/ui/core';

export const ARENA_PHOTO = '/images/arena-night-sm.webp';

// ---------- Status helpers ----------

export type Tone = 'green' | 'amber' | 'red' | 'grey' | 'blue';

export const bookingStatus = (b: Booking): { label: string; tone: Tone } => {
  switch (b.status) {
    case 'upcoming':
      return { label: 'Confirmed', tone: 'green' };
    case 'pending':
      return { label: 'Payment pending', tone: 'amber' };
    case 'completed':
      return { label: 'Completed', tone: 'grey' };
    default:
      return { label: 'Cancelled', tone: 'red' };
  }
};

export const paymentStatus = (b: Booking): { label: string; tone: Tone } => {
  if (b.status === 'pending') return { label: 'Awaiting payment', tone: 'amber' };
  if (b.status === 'cancelled') {
    if (b.refundAmount === null) return { label: 'Not paid', tone: 'grey' };
    return b.refundAmount > 0 ? { label: `Refund ${rupees(b.refundAmount)}`, tone: 'blue' } : { label: 'Paid · no refund', tone: 'grey' };
  }
  return { label: b.paymentMethodLabel ? `Paid · ${b.paymentMethodLabel}` : 'Paid', tone: 'green' };
};

export const Pill = ({ tone, children }: { tone: Tone; children: ReactNode }) => <span className={cx('bk-pill', tone)}>{children}</span>;

// ---------- Hold / payment timer ----------

export const HoldTimer = ({ secondsLeft, total, label = 'Your slots are held for you' }: { secondsLeft: number; total: number; label?: string }) => {
  const urgent = secondsLeft < 120;
  return (
    <div className={cx('bk-timer', urgent && 'urgent')} role="timer" aria-live="off">
      <LuTimer aria-hidden />
      <span className="grow">{urgent ? 'Your slots are about to be released' : label}</span>
      <b>{clock(secondsLeft)}</b>
      <i style={{ width: `${Math.max(0, Math.min(100, (secondsLeft / total) * 100))}%` }} />
    </div>
  );
};

// ---------- Summary rows ----------

export interface SlotInfo {
  date: string;
  startHour: number;
  hours: number;
}

export const SlotFacts = ({ slot, compact = false }: { slot: SlotInfo; compact?: boolean }) => (
  <dl className={cx('bk-facts', compact && 'compact')}>
    <div>
      <dt>
        <LuCalendarDays aria-hidden /> Date
      </dt>
      <dd>{compact ? shortDate(slot.date) : longDate(slot.date)}</dd>
    </div>
    <div>
      <dt>
        <LuClock aria-hidden /> Start
      </dt>
      <dd>{hourLabel(slot.startHour)}</dd>
    </div>
    <div>
      <dt>
        <LuClock aria-hidden /> End
      </dt>
      <dd>{hourLabel(slot.startHour + slot.hours)}</dd>
    </div>
    <div>
      <dt>
        <LuHourglass aria-hidden /> Duration
      </dt>
      <dd>{hoursText(slot.hours)}</dd>
    </div>
  </dl>
);

export const ArenaHeader = ({ name, sub, rate }: { name: string; sub: string; rate?: number }) => (
  <div className="bk-arena">
    <img src={ARENA_PHOTO} alt="" />
    <div className="grow">
      <strong>{name}</strong>
      <span>
        <LuMapPin aria-hidden /> {sub}
      </span>
    </div>
    {rate !== undefined && (
      <span className="bk-rate">
        {rupees(rate)}
        <small>/hr</small>
      </span>
    )}
  </div>
);

// Server price, shown as-is: hourly × hours, offer, additional charges, GST, total.
export const PriceLines = ({ price }: { price: Price }) => (
  <dl className="bk-price">
    <div>
      <dt>
        {rupees(price.hourlyRate)} × {hoursText(price.hours)}
      </dt>
      <dd>{rupees(price.subtotal)}</dd>
    </div>
    {price.discount > 0 && (
      <div className="discount">
        <dt>Offer{price.couponCode ? ` (${price.couponCode})` : ''}</dt>
        <dd>− {rupees(price.discount)}</dd>
      </div>
    )}
    {price.platformFee > 0 && (
      <div>
        <dt>Additional charges</dt>
        <dd>{rupees(price.platformFee)}</dd>
      </div>
    )}
    {price.taxes > 0 && (
      <div>
        <dt>GST ({price.gstRate}%)</dt>
        <dd>{rupees(price.taxes)}</dd>
      </div>
    )}
    <div className="total">
      <dt>Total payable</dt>
      <dd>{rupees(price.total)}</dd>
    </div>
  </dl>
);

export const PriceSkeleton = () => (
  <div className="bk-price-skel" aria-hidden>
    <i />
    <i />
    <i />
  </div>
);

export const PriceError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="bk-price-err" role="alert">
    <LuCircleAlert aria-hidden />
    <span className="grow">We couldn't load the price.</span>
    <button type="button" onClick={onRetry}>
      Retry
    </button>
  </div>
);
