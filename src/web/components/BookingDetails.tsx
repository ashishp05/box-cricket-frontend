import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { LuCalendarClock, LuCopy, LuLock, LuNavigation, LuPhone, LuShare2, LuTicketX } from 'react-icons/lu';
import { Link } from 'react-router-dom';

import { errorMessage } from '@shared/api/client';
import type { Booking } from '@shared/api/types';
import { dateTime, hourLabel, hoursText, longDate, phoneText, rupees, shortDate, shortRange, weekdayShort } from '@shared/lib/format';
import { dateRange, hoursUntil, slotStart, todayIST } from '@shared/lib/time';
import { Banner, Button, Skeleton, cx } from '@shared/ui/core';
import { Modal } from '@shared/ui/Modal';
import { useToast } from '@shared/ui/Toast';

import { api, queryKeys } from '../api';
import { useVenue } from '../hooks';
import { bookingStatus, paymentStatus, Pill, PriceLines } from './booking';
import { mapsUrl } from './MapCard';
import { TimeSlots } from './SlotPickers';
import { TicketDownload } from './TicketDownload';

const REASONS = ['Team members not available', 'Weather', 'Booked by mistake', 'Found another time', 'Other'];

// The published policy, so the customer knows the outcome before confirming; the server decides.
export const refundText = (b: Booking): string => {
  if (b.status === 'pending') return 'Nothing has been paid yet, so there is nothing to refund.';
  const h = hoursUntil(b.date, b.startHour);
  if (h >= 24) return `Cancel now for a full refund of ${rupees(b.price.total)}.`;
  if (h >= 6) return `Cancel now for a 50% refund (${rupees(b.price.total / 2)}).`;
  return 'This is too close to the start time for a refund.';
};

export const canCancel = (b: Booking) => (b.status === 'upcoming' || b.status === 'pending') && slotStart(b.date, b.startHour).getTime() > Date.now();
export const canReschedule = (b: Booking) => b.status === 'upcoming' && hoursUntil(b.date, b.startHour) >= 2;

export const shareText = (b: Booking) => `Box cricket at ${b.venueName}: ${longDate(b.date)}, ${b.slotLabel} (${b.pitchName}). Booking ID ${b.id}.`;

export const useShare = () => {
  const toast = useToast();
  return async (b: Booking) => {
    if (navigator.share) await navigator.share({ title: 'Riverside Cricket Box booking', text: shareText(b) }).catch(() => undefined);
    else await navigator.clipboard.writeText(shareText(b)).then(() => toast.show('Booking details copied - paste to share'));
  };
};

export const useCopyId = () => {
  const toast = useToast();
  return (id: string) =>
    void navigator.clipboard
      .writeText(id)
      .then(() => toast.show(`Booking ID ${id} copied`))
      .catch(() => toast.show(`Booking ID ${id}`));
};

const whenText = (b: Booking): string | null => {
  if (b.status !== 'upcoming') return null;
  const start = slotStart(b.date, b.startHour).getTime();
  const end = slotStart(b.date, b.endHour).getTime();
  const now = Date.now();
  if (now >= end) return 'Played';
  if (now >= start) return 'On now';
  const hours = (start - now) / 3_600_000;
  if (hours >= 24) return `In ${Math.floor(hours / 24)} day${hours >= 48 ? 's' : ''}`;
  if (hours >= 1) return `In ${Math.floor(hours)} hr${hours >= 2 ? 's' : ''}`;
  return `In ${Math.max(1, Math.round(hours * 60))} min`;
};

// ---------- Ticket with entry QR ----------

export const QrTicket = ({ booking: b, size = 150 }: { booking: Booking; size?: number }) => {
  const copy = useCopyId();
  const active = b.status === 'upcoming';
  const st = bookingStatus(b);
  return (
    <div className={cx('qt', b.status === 'cancelled' && 'void')}>
      <div className="qt-top">
        <div className="qt-row">
          <span className="qt-id">
            {b.id}
            <button type="button" onClick={() => copy(b.id)} aria-label="Copy booking ID">
              <LuCopy />
            </button>
          </span>
          <Pill tone={st.tone}>{st.label}</Pill>
        </div>
        <strong className="qt-venue">{b.venueName}</strong>
        <span className="qt-where">
          {b.pitchName} · {b.venueArea}
        </span>
        <div className="qt-facts">
          <div>
            <small>Date</small>
            <b>{shortDate(b.date)}</b>
          </div>
          <div>
            <small>Time</small>
            <b>{shortRange(b.startHour, b.hours)}</b>
          </div>
          <div>
            <small>Duration</small>
            <b>{hoursText(b.hours)}</b>
          </div>
        </div>
      </div>
      <div className="qt-cut" aria-hidden />
      <div className="qt-bottom">
        <div className="qt-qr">
          {active ? (
            <QRCodeSVG value={b.id} size={size} fgColor="#062019" />
          ) : (
            <span style={{ width: size, height: size }}>
              <LuLock aria-hidden />
            </span>
          )}
        </div>
        <p>
          {b.status === 'cancelled'
            ? 'This booking was cancelled, so the entry QR is no longer valid.'
            : b.status === 'completed'
              ? 'Thanks for playing! This ticket has been used.'
              : active
                ? 'Show this QR at the gate. Arrive 10 minutes early.'
                : 'Your entry QR appears as soon as the payment is confirmed.'}
        </p>
      </div>
    </div>
  );
};

// ---------- Cancel ----------

export const CancelDialog = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState(REASONS[0]);
  const cancel = useMutation({
    mutationFn: () => api.cancel(booking.id, reason),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.booking(booking.id), result);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myBookings });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast.show(result.refundAmount ? `Booking cancelled. ${rupees(result.refundAmount)} refund is on its way.` : 'Booking cancelled.');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const noRefund = refundText(booking).startsWith('This is too close');
  return (
    <Modal
      open
      onClose={onClose}
      title="Cancel this booking?"
      subtitle={`${longDate(booking.date)} · ${booking.slotLabel}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Keep booking
          </Button>
          <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Cancel booking
          </Button>
        </>
      }
    >
      <div className="stack">
        <Banner tone={noRefund ? 'warning' : 'info'}>{refundText(booking)}</Banner>
        <span className="field-label">Why are you cancelling?</span>
        <div className="row wrap" style={{ '--gap': '8px' } as React.CSSProperties}>
          {REASONS.map((r) => (
            <button key={r} type="button" className="bk-chip sm" aria-pressed={reason === r} onClick={() => setReason(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// ---------- Reschedule ----------

export const RescheduleDialog = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const venue = useVenue();
  const today = todayIST();
  const [date, setDate] = useState(booking.date);
  const [start, setStart] = useState<number | null>(null);
  const slots = useQuery({ queryKey: queryKeys.slots(date, booking.pitchId), queryFn: () => api.slots(date, booking.pitchId) });
  const own = date === booking.date ? Array.from({ length: booking.hours }, (_, i) => booking.startHour + i) : [];
  const selected = start === null ? [] : Array.from({ length: booking.hours }, (_, i) => start + i);
  const fits =
    start !== null &&
    selected.every((h) => {
      const s = slots.data?.slots.find((x) => x.hour === h);
      return s && (s.status === 'available' || (own.includes(h) && s.status !== 'past'));
    });
  const move = useMutation({
    mutationFn: () => api.reschedule(booking.id, date, start!),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.booking(booking.id), result);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myBookings });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast.show(`Moved to ${shortDate(result.date)}, ${result.slotLabel}.`);
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const days = venue.data ? dateRange(today, venue.data.advanceDays + 1) : [];
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Reschedule your game"
      subtitle={`Pick a new start time. Same duration (${hoursText(booking.hours)}) and price. Free until 2 hours before your slot.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" disabled={!fits || (date === booking.date && start === booking.startHour)} loading={move.isPending} onClick={() => move.mutate()}>
            {start !== null ? `Move to ${shortRange(start, booking.hours)}` : 'Confirm'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="rs-days" role="group" aria-label="Choose a date">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === date}
              onClick={() => {
                setDate(d);
                setStart(null);
              }}
            >
              <small>{weekdayShort(d)}</small>
              <b>{Number(d.slice(8))}</b>
            </button>
          ))}
        </div>
        {slots.data ? (
          <TimeSlots slots={slots.data.slots} selected={selected} ownHours={own} showPrice={false} onToggle={setStart} />
        ) : (
          <Skeleton height={200} />
        )}
        {start !== null && !fits && <span className="field-error">Not enough free back-to-back hours from {hourLabel(start)}. Pick an earlier start or another day.</span>}
      </div>
    </Modal>
  );
};

// ---------- Full details (modal and page) ----------

export const BookingDetailsBody = ({ booking: b }: { booking: Booking }) => {
  const venue = useVenue();
  const share = useShare();
  const [dialog, setDialog] = useState<'cancel' | 'move' | null>(null);
  const address = venue.data?.address ?? 'At Ashmavati Riverfront, Opp. Jalaram Colony, M. G. Road, Porbandar';
  const phone = venue.data?.phone ?? '+91 75071 97507';
  const pay = paymentStatus(b);
  const when = whenText(b);

  return (
    <div className="bd">
      <div className="bd-grid">
        <div className="bd-left">
          <QrTicket booking={b} />
          <div className="bd-actions">
            <TicketDownload booking={b} address={address} className="lime" />
            {b.status === 'pending' && (
              <Link to={`/checkout/payment/${b.id}`} className="btn primary">
                Complete payment
              </Link>
            )}
            <a className="btn outline" href={mapsUrl(address)} target="_blank" rel="noreferrer">
              <LuNavigation aria-hidden /> Directions
            </a>
            <button type="button" className="btn outline" onClick={() => void share(b)}>
              <LuShare2 aria-hidden /> Share
            </button>
          </div>
        </div>

        <div className="bd-right">
          <section className="bd-sec">
            <h4>Booking</h4>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>
                  <Pill tone={bookingStatus(b).tone}>{bookingStatus(b).label}</Pill> {when && <span className="bd-when">{when}</span>}
                </dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{longDate(b.date)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>
                  {hourLabel(b.startHour)} – {hourLabel(b.startHour + b.hours)} ({hoursText(b.hours)})
                </dd>
              </div>
              <div>
                <dt>Arena</dt>
                <dd>
                  {b.venueName}, {b.pitchName}
                </dd>
              </div>
              <div>
                <dt>Booked on</dt>
                <dd>{dateTime(b.createdAt)}</dd>
              </div>
              {b.cancelReason && (
                <div>
                  <dt>Cancel reason</dt>
                  <dd>{b.cancelReason}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bd-sec">
            <h4>Payment</h4>
            <PriceLines price={b.price} />
            <dl>
              <div>
                <dt>Payment status</dt>
                <dd>
                  <Pill tone={pay.tone}>{pay.label}</Pill>
                </dd>
              </div>
              {b.refundAmount !== null && (
                <div>
                  <dt>Refund</dt>
                  <dd>{b.refundAmount > 0 ? `${rupees(b.refundAmount)} · 3–5 working days` : 'No refund (policy)'}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bd-sec">
            <h4>Customer</h4>
            <dl>
              <div>
                <dt>Name</dt>
                <dd>{b.customerName}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{phoneText(b.customerPhone)}</dd>
              </div>
              <div>
                <dt>Players</dt>
                <dd>{b.players ?? '—'}</dd>
              </div>
              {b.notes && (
                <div>
                  <dt>Requests</dt>
                  <dd>{b.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          {(canCancel(b) || b.status === 'upcoming') && (
            <section className="bd-sec bd-manage">
              <h4>Manage</h4>
              <div className="bd-manage-row">
                {b.status === 'upcoming' && (
                  <Button variant="outline" disabled={!canReschedule(b)} onClick={() => setDialog('move')}>
                    <LuCalendarClock aria-hidden /> Reschedule
                  </Button>
                )}
                {canCancel(b) && (
                  <Button variant="danger-outline" onClick={() => setDialog('cancel')}>
                    <LuTicketX aria-hidden /> Cancel booking
                  </Button>
                )}
              </div>
              <p className="bd-fine">
                {b.status === 'upcoming' && !canReschedule(b) ? 'Rescheduling closes 2 hours before your slot. ' : ''}
                {canCancel(b) ? refundText(b) : ''}
              </p>
              <a className="bk-link small" href={`tel:${phone.replace(/\s/g, '')}`}>
                <LuPhone aria-hidden /> Need help? Call the arena
              </a>
            </section>
          )}
        </div>
      </div>

      {dialog === 'cancel' && <CancelDialog booking={b} onClose={() => setDialog(null)} />}
      {dialog === 'move' && <RescheduleDialog booking={b} onClose={() => setDialog(null)} />}
    </div>
  );
};
