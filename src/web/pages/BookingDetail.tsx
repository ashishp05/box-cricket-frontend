import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  MdAccessTime,
  MdArrowBack,
  MdCall,
  MdCalendarMonth,
  MdDirections,
  MdDownload,
  MdEditCalendar,
  MdEventBusy,
  MdHeadsetMic,
  MdShare,
  MdSportsCricket,
  MdTextsms,
} from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { errorMessage } from '@shared/api/client';
import type { Booking } from '@shared/api/types';
import { downloadCalendarFile } from '@shared/lib/calendar';
import { hoursText, longDate, phoneText, rupees, shortDate, shortRange } from '@shared/lib/format';
import { addDays, dateRange, hoursUntil, slotStart, todayIST } from '@shared/lib/time';
import { Banner, Button, ErrorState, Loading, StatusBadge } from '@shared/ui/core';
import { Modal } from '@shared/ui/Modal';
import { DateStrip, SlotGrid } from '@shared/ui/SlotPicker';
import { useToast } from '@shared/ui/Toast';

import { api, queryKeys } from '../api';
import { Confetti } from '../components/confetti';
import { mapsUrl } from '../components/MapCard';
import { RequireLogin } from '../components/RequireLogin';
import { Receipt, Ticket } from '../components/Ticket';
import { useVenue } from '../hooks';

const REASONS = ['Team members not available', 'Weather', 'Booked by mistake', 'Found another time', 'Other'];

// The published policy, so the customer knows the outcome before confirming; the server decides.
export const refundText = (b: Booking): string => {
  if (b.status === 'pending') return 'Nothing has been paid yet, so there is nothing to refund.';
  const h = hoursUntil(b.date, b.startHour);
  if (h >= 24) return 'Cancel now for a full refund.';
  if (h >= 6) return `Cancel now for a 50% refund (${rupees(b.price.total / 2)}).`;
  return 'This is too close to the start time for a refund.';
};

const shareText = (b: Booking) => `Box cricket at ${b.venueName}: ${longDate(b.date)}, ${b.slotLabel} (${b.pitchName}). Booking ID ${b.id}.`;

const useShare = () => {
  const toast = useToast();
  return async (b: Booking) => {
    if (navigator.share) await navigator.share({ title: 'Riverside Cricket Box booking', text: shareText(b) }).catch(() => undefined);
    else await navigator.clipboard.writeText(shareText(b)).then(() => toast.show('Booking details copied - paste to share'));
  };
};

const startsText = (b: Booking): string => {
  if (b.status === 'cancelled') return b.refundAmount ? `${rupees(b.refundAmount)} will be refunded to your original payment method in 3-5 working days.` : 'This booking was cancelled.';
  if (b.status === 'pending') return 'Payment pending. Unpaid bookings are released after 15 minutes.';
  const start = slotStart(b.date, b.startHour).getTime();
  const end = slotStart(b.date, b.endHour).getTime();
  const now = Date.now();
  if (b.status === 'completed' || now >= end) return `You played here on ${shortDate(b.date)}. Good game!`;
  if (now >= start) return 'Your match is on now. Enjoy!';
  const hours = (start - now) / 3_600_000;
  const when = hours >= 24 ? `${Math.floor(hours / 24)} day${hours >= 48 ? 's' : ''}` : hours >= 1 ? `${Math.floor(hours)} hr${hours >= 2 ? 's' : ''}` : `${Math.max(1, Math.round(hours * 60))} min`;
  return `Starts in ${when}. Show your QR at the gate.`;
};

const CancelDialog = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState(REASONS[0]);
  const cancel = useMutation({
    mutationFn: () => api.cancel(booking.id, reason),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.booking(booking.id), result);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myBookings });
      toast.show(result.refundAmount ? `Booking cancelled. ${rupees(result.refundAmount)} refund is on its way.` : 'Booking cancelled.');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="Cancel this booking?"
      subtitle={`${longDate(booking.date)} · ${booking.slotLabel}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Keep my booking
          </Button>
          <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Cancel booking
          </Button>
        </>
      }
    >
      <div className="stack">
        <Banner tone={refundText(booking).startsWith('This is too close') ? 'warning' : 'info'}>{refundText(booking)}</Banner>
        <span className="field-label">Why are you cancelling?</span>
        <div className="row wrap" style={{ '--gap': '8px' } as React.CSSProperties}>
          {REASONS.map((r) => (
            <button key={r} type="button" className="chip sm" aria-pressed={reason === r} onClick={() => setReason(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

const RescheduleDialog = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
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
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Pick a new time"
      subtitle={`Same duration (${hoursText(booking.hours)}) and price. Free until 2 hours before your slot.`}
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
        {venue.data && (
          <DateStrip
            dates={dateRange(today, Math.min(venue.data.advanceDays + 1, 15))}
            value={date}
            min={today}
            max={addDays(today, venue.data.advanceDays)}
            onChange={(d) => {
              setDate(d);
              setStart(null);
            }}
          />
        )}
        {slots.data ? <SlotGrid slots={slots.data.slots} selected={selected} ownHours={own} showPrice={false} onToggle={setStart} /> : <Loading />}
        {start !== null && !fits && <span className="field-error">Not enough free back-to-back hours from that start. Pick an earlier start or another day.</span>}
      </div>
    </Modal>
  );
};

const Detail = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const venue = useVenue();
  const share = useShare();
  const [dialog, setDialog] = useState<'cancel' | 'move' | null>(null);
  const booking = useQuery({ queryKey: queryKeys.booking(id), queryFn: () => api.booking(id) });

  if (booking.isLoading) return <Loading />;
  if (booking.isError) return <ErrorState error={booking.error} title="We could not find this booking" onRetry={() => booking.refetch()} />;
  const b = booking.data!;
  const active = b.status === 'upcoming' || b.status === 'pending';
  const canMove = b.status === 'upcoming' && hoursUntil(b.date, b.startHour) >= 2;
  const phone = venue.data?.phone ?? '+91 75071 97507';

  return (
    <div style={{ width: 'min(900px, 100%)', margin: '0 auto', paddingTop: 16 }}>
      <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
        <button type="button" className="back-btn" onClick={() => navigate('/bookings')} aria-label="Back to bookings">
          <MdArrowBack />
        </button>
        <h1 style={{ fontSize: 22 }}>Booking details</h1>
      </div>
      <div className="row wrap" style={{ marginTop: 14, '--gap': '12px' } as React.CSSProperties}>
        <StatusBadge status={b.status} />
        <span style={{ fontSize: 15 }}>{startsText(b)}</span>
      </div>

      <div className="ticket-layout" style={{ marginTop: 16, gridTemplateColumns: undefined }}>
        <div>
          <Ticket booking={b} />
          <div className="action-tiles">
            <a className="action-tile" href={mapsUrl(venue.data?.address ?? 'Ashmavati Riverfront Porbandar')} target="_blank" rel="noreferrer">
              <MdDirections aria-hidden /> Directions
            </a>
            <a className="action-tile" href={`tel:${phone.replace(/\s/g, '')}`}>
              <MdCall aria-hidden /> Call arena
            </a>
            <button type="button" className="action-tile" onClick={() => void share(b)}>
              <MdShare aria-hidden /> Share
            </button>
            <button type="button" className="action-tile" onClick={() => window.print()}>
              <MdDownload aria-hidden /> Invoice
            </button>
          </div>
        </div>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          {active && (
            <div className="card pad manage-card stack" style={{ '--gap': '10px' } as React.CSSProperties}>
              <strong style={{ fontSize: 17, fontWeight: 500 }}>Manage booking</strong>
              {b.status === 'pending' ? (
                <Link to={`/checkout/payment/${b.id}`} className="btn primary block" style={{ height: 52 }}>
                  Complete payment
                </Link>
              ) : (
                <Button variant="outline" block disabled={!canMove} onClick={() => setDialog('move')}>
                  <MdEditCalendar aria-hidden /> Reschedule
                </Button>
              )}
              <Button variant="danger" block onClick={() => setDialog('cancel')}>
                <MdEventBusy aria-hidden /> Cancel booking
              </Button>
              <p className="tiny muted">{b.status === 'upcoming' && !canMove ? 'Rescheduling closes 2 hours before your slot. ' : ''}{refundText(b)}</p>
              <a className="link" href={`tel:${phone.replace(/\s/g, '')}`} style={{ alignSelf: 'center', marginTop: 8 }}>
                <MdHeadsetMic size={20} aria-hidden /> Need help? Contact the arena
              </a>
            </div>
          )}
          {b.status === 'completed' && (
            <Link to="/book" className="btn primary lg block">
              <MdSportsCricket aria-hidden /> Book again
            </Link>
          )}
          <Receipt booking={b} />
        </div>
      </div>

      {dialog === 'cancel' && <CancelDialog booking={b} onClose={() => setDialog(null)} />}
      {dialog === 'move' && <RescheduleDialog booking={b} onClose={() => setDialog(null)} />}
    </div>
  );
};

export const BookingDetail = () => {
  const { id = '' } = useParams();
  return (
    <div className="container">
      <RequireLogin title="Log in to see this booking" text="Log in with the mobile number you booked with to see this booking.">
        <Detail id={id} />
      </RequireLogin>
    </div>
  );
};

const ConfirmedInner = ({ id }: { id: string }) => {
  const venue = useVenue();
  const share = useShare();
  const toast = useToast();
  const booking = useQuery({ queryKey: queryKeys.booking(id), queryFn: () => api.booking(id) });
  if (booking.isLoading) return <Loading />;
  if (booking.isError) return <ErrorState error={booking.error} title="We could not find this booking" />;
  const b = booking.data!;
  const paid = b.status === 'upcoming';
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText(b))}`;

  return (
    <div style={{ position: 'relative' }}>
      {paid && <Confetti />}
      <div className="confirm-hero">
        <div className="tick">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h1>{paid ? 'You are all set!' : 'Booking received'}</h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 6 }}>
          {paid ? `Your slot at ${b.venueName} is confirmed.` : 'We will confirm as soon as your payment clears.'}
        </p>
        <p style={{ marginTop: 6, fontSize: 15 }}>
          {b.customerName} · {phoneText(b.customerPhone)}
        </p>
        <p className="tiny muted" style={{ marginTop: 6 }}>
          {paid ? `SMS sent to ${phoneText(b.customerPhone)}. Save booking ID ${b.id}.` : `We will SMS ${phoneText(b.customerPhone)} when payment clears.`}
        </p>
      </div>
      <div className="ticket-layout">
        <div>
          <Ticket booking={b} />
          <div className="action-tiles">
            <button
              type="button"
              className="action-tile"
              onClick={() => {
                downloadCalendarFile(b, venue.data?.address ?? b.venueArea);
                toast.show('Calendar file downloaded');
              }}
            >
              <MdCalendarMonth aria-hidden /> Calendar
            </button>
            <a className="action-tile" href={mapsUrl(venue.data?.address ?? 'Ashmavati Riverfront Porbandar')} target="_blank" rel="noreferrer">
              <MdDirections aria-hidden /> Directions
            </a>
            <button type="button" className="action-tile" onClick={() => void share(b)}>
              <MdShare aria-hidden /> Share
            </button>
            <a className="action-tile" href={whatsapp} target="_blank" rel="noreferrer">
              <MdTextsms aria-hidden /> WhatsApp
            </a>
          </div>
        </div>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <div className="card pad">
            <strong style={{ fontSize: 17, fontWeight: 500 }}>Before you play</strong>
            <div className="stack" style={{ '--gap': '12px', marginTop: 14 } as React.CSSProperties}>
              {[
                [MdAccessTime, 'Arrive 10 minutes early to warm up.'],
                [MdSportsCricket, 'Bring your own bat or rent one at the venue.'],
                [MdEditCalendar, 'Plans changed? Reschedule or cancel from My Bookings.'],
              ].map(([Icon, text]) => {
                const I = Icon as typeof MdAccessTime;
                return (
                  <div key={text as string} className="summary-line" style={{ padding: 0 }}>
                    <I aria-hidden /> {text as string}
                  </div>
                );
              })}
            </div>
          </div>
          <Receipt booking={b} />
          <Link to={`/bookings/${b.id}`} className="btn primary lg block">
            View booking details
          </Link>
          <Link to="/" className="link" style={{ alignSelf: 'center', fontSize: 17 }}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export const Confirmed = () => {
  const { id = '' } = useParams();
  return (
    <div className="container">
      <RequireLogin title="Log in to see this booking">
        <ConfirmedInner id={id} />
      </RequireLogin>
    </div>
  );
};
